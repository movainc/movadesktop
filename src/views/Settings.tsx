import { useEffect, useState } from "react";
import { Cloud, HardDrive, Monitor, Moon, Sun } from "lucide-react";
import { aiConfigure, aiForgetKey, aiStatus, isDesktop, type AiStatus } from "../lib/ai";
import { useStore } from "../lib/store";
import { useSession } from "../lib/session";
import { authStatus, configureGoogle, forgetGoogleClient, signOut, type AuthStatus } from "../lib/auth";
import { startSync, stopSync, syncNow } from "../lib/sync";
import { Avatar, SyncBadge } from "../components/AccountMenu";
import { GoogleDriveLogo } from "../components/GoogleDriveLogo";
import type { Theme } from "../lib/types";
import { LogoMark } from "../components/Logo";
import { Kbd, modKey } from "../components/ui";

const CREDITS = [
  { name: "Monaco Editor", what: "code editor, the core of Code - OSS (VS Code)", license: "MIT · © Microsoft", url: "https://github.com/microsoft/monaco-editor" },
  { name: "Tauri", what: "desktop runtime", license: "MIT / Apache-2.0", url: "https://tauri.app" },
  { name: "React", what: "interface", license: "MIT · © Meta", url: "https://react.dev" },
  { name: "Zustand", what: "state", license: "MIT", url: "https://github.com/pmndrs/zustand" },
  { name: "Lucide", what: "icons", license: "ISC", url: "https://lucide.dev" },
  { name: "Material Icon Theme", what: "file-type icons", license: "MIT · © Material Extensions", url: "https://github.com/material-extensions/vscode-material-icon-theme" },
  { name: "Inter", what: "typeface by Rasmus Andersson", license: "SIL OFL 1.1", url: "https://rsms.me/inter" },
];

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export function Settings() {
  const { theme, setTheme } = useSession();
  const { resetWorkspace, startTour } = useStore();
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

      <AccountSettings />

      {isDesktop ? <AiSettings /> : (
        <section className="settings-group">
          <h2 className="section-title">AI</h2>
          <p className="quiet">The assistant and AI suggestions are available in the mova desktop app, which keeps API keys safely out of the browser.</p>
        </section>
      )}

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
          {isDesktop && <><dt>Assistant</dt><dd><Kbd>{modKey}</Kbd><Kbd>J</Kbd></dd></>}
          <dt>Toggle sidebar</dt><dd><Kbd>{modKey}</Kbd><Kbd>\</Kbd></dd>
        </dl>
      </section>

      <section className="settings-group">
        <h2 className="section-title">Workspace</h2>
        <div className="settings-row">
          <div>
            <p className="settings-label">Tutorial</p>
            <p className="quiet">Walk through mova step by step: projects, tasks, calendar, notes, files, code, search and focus.</p>
          </div>
          <button className="btn" onClick={startTour}>Start tutorial</button>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-label">Clear workspace</p>
            <p className="quiet">Deletes every project, task, note, file and event in this account's workspace. If cloud sync is on, the cleared workspace syncs too.</p>
          </div>
          <button className="btn btn-danger" onClick={() => confirm("Delete everything in this workspace? This can't be undone.") && resetWorkspace()}>Clear…</button>
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
          <p className="quiet">Everything for what you're working on. <a className="about-link" href="https://movadesktop.vercel.app" target="_blank" rel="noreferrer">movadesktop.vercel.app</a></p>
          <p className="quiet"><a className="about-link" href="https://movadesktop.vercel.app/terms" target="_blank" rel="noreferrer">Terms of Use</a> · <a className="about-link" href="https://movadesktop.vercel.app/privacy" target="_blank" rel="noreferrer">Privacy</a></p>
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

function AccountSettings() {
  const { account, cloudSync, setCloudSync, syncState } = useSession();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [clientJson, setClientJson] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { authStatus().then(setStatus).catch(() => {}); }, []);
  if (!account) return null;

  const isGoogleDesktop = account.provider === "google";
  const toggleSync = async (on: boolean) => {
    setCloudSync(on);
    if (!isGoogleDesktop) return;
    if (on && status?.drive) await startSync();
    else { stopSync(); useSession.getState().setSync("off"); }
    if (on && !status?.drive) setMsg("Sign out and back in to allow mova to use its Drive folder.");
  };

  return (
    <section className="settings-group">
      <h2 className="section-title">Account</h2>
      <div className="settings-row">
        <div className="settings-account">
          <Avatar name={account.name} picture={account.picture} size={40} />
          <div>
            <p className="settings-label">{account.name}</p>
            <p className="quiet">{account.email} · {account.provider === "test" ? "Test account" : "Google"}</p>
          </div>
        </div>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>

      <div className="settings-row">
        <div>
          <p className="settings-label">Where your workspace is saved</p>
          <p className="quiet">
            {isGoogleDesktop
              ? "Always on this device. With cloud sync on, it's also saved to a private mova folder in your Google Drive that only mova can see, so it follows you to other computers."
              : account.provider === "google-web"
                ? "In this browser. Use the desktop app for Google Drive sync."
                : "On this device."}
          </p>
          {isGoogleDesktop && <div className="settings-sync"><SyncBadge />{syncState !== "off" && <button className="link-btn" onClick={syncNow}>Sync now</button>}</div>}
          {msg && <p className="quiet">{msg}</p>}
        </div>
        {isGoogleDesktop ? (
          <div className="seg-toggle" role="radiogroup" aria-label="Storage">
            <button role="radio" aria-checked={!cloudSync} className={!cloudSync ? "is-active" : ""} onClick={() => toggleSync(false)}><HardDrive size={13} /> Device</button>
            <button role="radio" aria-checked={cloudSync} className={cloudSync ? "is-active" : ""} onClick={() => toggleSync(true)}><Cloud size={13} /> Device + Drive</button>
          </div>
        ) : <span className="chip"><HardDrive size={12} /> Local</span>}
      </div>

      {isGoogleDesktop && (
        <div className="settings-row">
          <div>
            <p className="settings-label settings-label-icon"><GoogleDriveLogo size={14} /> Google Drive files</p>
            <p className="quiet">{status?.drive_files ? "Connected. Open Files → Google Drive to edit files in your Drive." : "Not connected. Open Files → Google Drive to connect."}</p>
          </div>
          <span className={`chip ${status?.drive_files ? "is-active" : ""}`}>{status?.drive_files ? "Connected" : "Off"}</span>
        </div>
      )}

      {isDesktop && (
        <details className="settings-advanced">
          <summary>Google sign-in configuration</summary>
          <p className="quiet">
            {status?.configured ? `OAuth client configured (${status.client_source === "env" ? "from MOVA_GOOGLE_CLIENT_ID" : "saved on this computer"}).` : "No OAuth client configured."} Replace it by pasting the Desktop-app client JSON from Google Cloud Console.
          </p>
          <form className="field-row" onSubmit={async (e) => {
            e.preventDefault();
            try { setStatus(await configureGoogle(clientJson)); setClientJson(""); setMsg("Google OAuth client saved."); } catch (err) { setMsg(String(err)); }
          }}>
            <input className="input" value={clientJson} onChange={(e) => setClientJson(e.target.value)} placeholder="Client JSON or client ID" spellCheck={false} />
            <button className="btn" type="submit" disabled={!clientJson.trim()}>Save</button>
            {status?.client_source === "saved" && <button className="btn btn-ghost btn-danger" type="button" onClick={async () => setStatus(await forgetGoogleClient())}>Remove</button>}
          </form>
        </details>
      )}
    </section>
  );
}
