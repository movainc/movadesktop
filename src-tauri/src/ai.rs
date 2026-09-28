use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_MODEL: &str = "gpt-6-luna";
const ENDPOINT: &str = "https://api.openai.com/v1/chat/completions";
const MAX_TOKENS_CAP: u32 = 600;

#[derive(Serialize, Deserialize, Default)]
struct AiConfig {
    api_key: Option<String>,
    model: Option<String>,
}

#[derive(Serialize)]
pub struct AiStatus {
    configured: bool,
    model: String,
    from_env: bool,
}

#[derive(Deserialize, Serialize)]
pub struct Message {
    role: String,
    content: String,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("ai.json"))
}

fn load(app: &AppHandle) -> AiConfig {
    config_path(app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(app: &AppHandle, cfg: &AiConfig) -> Result<(), String> {
    let path = config_path(app)?;
    fs::write(&path, serde_json::to_string(cfg).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

fn env_key() -> Option<String> {
    std::env::var("MOVA_OPENAI_API_KEY").ok().filter(|k| !k.trim().is_empty())
}

fn resolve(app: &AppHandle) -> (Option<String>, String) {
    let cfg = load(app);
    let key = env_key().or(cfg.api_key).filter(|k| !k.trim().is_empty());
    let model = cfg.model.filter(|m| !m.trim().is_empty()).unwrap_or_else(|| DEFAULT_MODEL.into());
    (key, model)
}

#[tauri::command]
pub fn ai_status(app: AppHandle) -> AiStatus {
    let (key, model) = resolve(&app);
    AiStatus { configured: key.is_some(), model, from_env: env_key().is_some() }
}

#[tauri::command]
pub fn ai_configure(app: AppHandle, api_key: Option<String>, model: Option<String>) -> Result<AiStatus, String> {
    let mut cfg = load(&app);
    if let Some(k) = api_key {
        cfg.api_key = Some(k.trim().to_string()).filter(|k| !k.is_empty());
    }
    if let Some(m) = model {
        cfg.model = Some(m.trim().to_string()).filter(|m| !m.is_empty());
    }
    save(&app, &cfg)?;
    Ok(ai_status(app))
}

#[tauri::command]
pub fn ai_forget_key(app: AppHandle) -> Result<AiStatus, String> {
    let mut cfg = load(&app);
    cfg.api_key = None;
    save(&app, &cfg)?;
    Ok(ai_status(app))
}

#[tauri::command]
pub async fn ai_complete(app: AppHandle, messages: Vec<Message>, max_tokens: Option<u32>) -> Result<String, String> {
    let (key, model) = resolve(&app);
    let key = key.ok_or("No API key set. Add one in Settings → AI.")?;

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "max_completion_tokens": max_tokens.unwrap_or(400).min(MAX_TOKENS_CAP),
    });

    let res = reqwest::Client::new()
        .post(ENDPOINT)
        .bearer_auth(key)
        .json(&body)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| format!("Couldn't reach the AI service: {e}"))?;

    let status = res.status();
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        let msg = json["error"]["message"].as_str().unwrap_or("Unknown error");
        return Err(format!("AI request failed ({status}): {msg}"));
    }
    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.trim().to_string())
        .ok_or_else(|| "The AI returned an empty response.".into())
}
