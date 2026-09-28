import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { aiConfigure, aiForgetKey, aiStatus, isDesktop, type AiStatus } from "../lib/ai";
import { useStore } from "../lib/store";
import type { Theme } from "../lib/types";
import { LogoMark } from "../components/Logo";
import { Kbd, modKey } from "../components/ui";

const CREDITS = [
  { name: "Monaco Editor", what: "code editor, the core of Code - OSS (VS Code)", license: "MIT · © Microsoft", url: "https://github.com/microsoft/monaco-editor" },
  { name: "Tauri", what: "desktop runtime", license: "MIT / Apache-2.0", url: "https://tauri.app" },
  { name: "React", what: "interface", license: "MIT · © Meta", url: "https://react.dev" },
  { name: "Zustand", what: "state", license: "MIT", url: "https://github.com/pmndrs/zustand" },
  { name: "Lucide", what: "icons", license: "ISC", url: "https://lucide.dev" },
  { name: "Inter", what: "typeface by Rasmus Andersson", license: "SIL OFL 1.1", url: "https://rsms.me/inter" },
];

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export function Settings() {
  const { theme, setTheme, resetWorkspace } = useStore();
  return (
    <div className="page page-narrow">
      <header className="page-header"><div><h1>Settings</h1></div></header>

      <section className="settings-group">
        <h2 className="section-title">Appearance</h2>
        <div className="theme-picker">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-option ${theme === t.id ? "is-active" : ""}`} onClick={() => setTheme(t.id)}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <AiSettings />

      <section className="settings-group">
        <h2 className="section-title">Keyboard</h2>
        <dl className="shortcuts">
          <dt>Search everything</dt><dd><Kbd>{modKey}</Kbd><Kbd>K</Kbd></dd>
          <dt>Today</dt><dd><Kbd>{modKey}</Kbd><Kbd>1</Kbd></dd>
          <dt>Tasks</dt><dd><Kbd>{modKey}</Kbd><Kbd>2</Kbd></dd>
          <dt>Projects</dt><dd><Kbd>{modKey}</Kbd><Kbd>3</Kbd></dd>
          <dt>Calendar</dt><dd><Kbd>{modKey}</Kbd><Kbd>4</Kbd></dd>
          <dt>Notes</dt><dd><Kbd>{modKey}</Kbd><Kbd>5</Kbd></dd>
          <dt>Files</dt><dd><Kbd>{modKey}</Kbd><Kbd>6</Kbd></dd>
          <dt>Code</dt><dd><Kbd>{modKey}</Kbd><Kbd>7</Kbd></dd>
          <dt>Focus</dt><dd><Kbd>{modKey}</Kbd><Kbd>⇧</Kbd><Kbd>F</Kbd></dd>
          <dt>Assistant</dt><dd><Kbd>{modKey}</Kbd><Kbd>J</Kbd></dd>
          <dt>Toggle sidebar</dt><dd><Kbd>{modKey}</Kbd><Kbd>\</Kbd></dd>
        </dl>
      </section>

      <section className="settings-group">
        <h2 className="section-title">Workspace</h2>
        <div className="settings-row">
          <div>
            <p className="settings-label">Reset sample workspace</p>
            <p className="quiet">Replaces everything on this device with the sample projects.</p>
          </div>
          <button className="btn btn-danger" onClick={() => confirm("Reset workspace? This replaces all local data.") && resetWorkspace()}>Reset</button>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-label">Account & sync</p>
            <p className="quiet">Your workspace is stored on this device. Accounts, sync and sharing arrive with the mova cloud.</p>
          </div>
          <span className="chip">Local</span>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="section-title">Legal & credits</h2>
        <p className="quiet settings-note">mova is built on open-source software. Thank you to everyone who maintains it.</p>
        <dl className="credits">
          {CREDITS.map((c) => (
            <div key={c.name} style={{ display: "contents" }}>
              <dt><a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> <span>— {c.what}</span></dt>
              <dd>{c.license}</dd>
            </div>
          ))}
        </dl>
        <p className="quiet settings-note">Full notices ship in THIRD_PARTY_NOTICES.md. Use of mova is subject to the Terms of Use and Privacy Notice.</p>
      </section>

      <footer className="about">
        <LogoMark size={28} />
        <div>
          <p className="settings-label">mova 0.1.0</p>
          <p className="quiet">Everything for what you're working on.</p>
        </div>
      </footer>
    </div>
  );
}

function AiSettings() {
  const aiEnabled = useStore((s) => s.aiEnabled);
  const setAiEnabled = useStore((s) => s.setAiEnabled);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    aiStatus().then((s) => { setStatus(s); if (s) setModel(s.model); }).catch((e) => setMsg(String(e)));
  }, []);

  const save = async () => {
    try {
      const s = await aiConfigure(key || undefined, model || undefined);
      setStatus(s);
      setKey("");
      setMsg("Saved.");
    } catch (e) {
      setMsg(String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <section className="settings-group">
      <h2 className="section-title">AI</h2>
      <div className="settings-row">
        <div>
          <p className="settings-label">AI assistance</p>
          <p className="quiet">Small helpers only: the assistant, task suggestions from notes and breaking a task into steps. Nothing is added without your OK.</p>
        </div>
        <button className={`switch ${aiEnabled ? "is-on" : ""}`} role="switch" aria-checked={aiEnabled} aria-label="AI assistance" onClick={() => setAiEnabled(!aiEnabled)}><span /></button>
      </div>
      {aiEnabled && (
        !isDesktop ? (
          <p className="quiet settings-note">AI runs through the mova desktop app, which keeps your key out of the browser.</p>
        ) : (
          <div className="ai-settings">
            <div className="ai-status">
              <span className={`status-dot ${status?.configured ? "is-on" : ""}`} />
              {status?.configured ? (status.from_env ? "Using key from MOVA_OPENAI_API_KEY" : "API key saved on this device") : "No API key yet"}
            </div>
            <form className="form" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">OpenAI API key</span>
                  <input className="input" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} placeholder={status?.configured ? "•••••••• (leave blank to keep)" : "sk-..."} />
                </label>
                <label className="field">
                  <span className="field-label">Model</span>
                  <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-6-luna" />
                </label>
              </div>
              <div className="field-row">
                <button className="btn btn-primary" type="submit">Save</button>
                {status?.configured && !status.from_env && (
                  <button className="btn btn-ghost btn-danger" type="button" onClick={async () => { setStatus(await aiForgetKey()); setMsg("Key removed."); }}>Remove key</button>
                )}
                {msg && <span className="quiet">{msg}</span>}
              </div>
            </form>
            <p className="quiet">The key is kept in mova's config folder on this computer and is only used by the app's native layer. It never goes to the interface or into sync.</p>
          </div>
        )
      )}
    </section>
  );
}
