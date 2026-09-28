import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckSquare, Cloud, Code2, FileText, HardDrive, Loader2, Settings2 } from "lucide-react";
import { LogoMark } from "../components/Logo";
import { isDesktop } from "../lib/ai";
import { authStatus, configureGoogle, signInWithGoogle, signInWithGoogleCredential, webClientId, type AuthStatus } from "../lib/auth";
import { useSession } from "../lib/session";

export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean; ux_mode?: string }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    } } };
  }
}

function loadGis(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Google sign-in."));
    document.head.appendChild(s);
  });
}

function GoogleWebButton({ onError }: { onError: (e: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!webClientId) return;
    loadGis()
      .then(() => {
        window.google!.accounts.id.initialize({
          client_id: webClientId!,
          callback: (r) => signInWithGoogleCredential(r.credential).catch((e) => onError(String(e instanceof Error ? e.message : e))),
        });
        const dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
        window.google!.accounts.id.renderButton(ref.current!, { theme: dark ? "filled_black" : "outline", size: "large", shape: "pill", text: "continue_with", width: 320 });
      })
      .catch((e) => onError(String(e.message)));
  }, [onError]);
  return <div ref={ref} className="gis-button" />;
}

const FEATURES = [
  { icon: CheckSquare, text: "Tasks, deadlines and a clear view of today" },
  { icon: CalendarDays, text: "Turn intentions into time on your calendar" },
  { icon: FileText, text: "Notes and files that live with their project" },
  { icon: Code2, text: "A real code editor, built on Code - OSS" },
];

export function SignIn() {
  const { cloudSync, setCloudSync } = useSession();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [clientJson, setClientJson] = useState("");

  useEffect(() => {
    authStatus().then(setStatus).catch(() => {});
  }, []);

  const signIn = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const saveClient = async () => {
    setError("");
    try {
      setStatus(await configureGoogle(clientJson));
      setClientJson("");
      setSetupOpen(false);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  const configured = !!status?.configured;
  const needsSetup = isDesktop && status !== null && !configured;

  return (
    <div className="signin">
      <aside className="signin-brand">
        <div className="signin-brand-top">
          <LogoMark size={34} />
          <span className="signin-wordmark">mova</span>
        </div>
        <div className="signin-pitch">
          <h1>Everything for what you're working on.</h1>
          <p>Projects, tasks, notes, files, calendar and code — connected, calm and in one place.</p>
          <ul>
            {FEATURES.map((f) => (
              <li key={f.text}><span className="signin-feature-icon"><f.icon size={15} /></span>{f.text}</li>
            ))}
          </ul>
        </div>
        <p className="signin-foot">© 2026 Mova Inc</p>
      </aside>

      <main className="signin-main">
        <div className="signin-card">
          <h2>Sign in to mova</h2>
          <p className="signin-sub">Use your Google account. Your workspace is private to you.</p>

          {isDesktop ? (
            <button className="google-btn" onClick={signIn} disabled={busy || !configured}>
              {busy ? <Loader2 size={18} className="spin" /> : <GoogleG />}
              <span>{busy ? "Waiting for Google…" : "Continue with Google"}</span>
            </button>
          ) : webClientId ? (
            <GoogleWebButton onError={setError} />
          ) : (
            <button className="google-btn" disabled><GoogleG /><span>Continue with Google</span></button>
          )}
          {busy && <p className="quiet signin-hint">Finish signing in in your browser, then come back here.</p>}

          {isDesktop ? <div className="storage-choice" role="radiogroup" aria-label="Where to save your workspace">
            <button role="radio" aria-checked={cloudSync} className={`storage-option ${cloudSync ? "is-active" : ""}`} onClick={() => setCloudSync(true)}>
              <Cloud size={16} />
              <span><strong>This device + Google Drive</strong><small>Synced to a private mova folder in your Drive</small></span>
            </button>
            <button role="radio" aria-checked={!cloudSync} className={`storage-option ${!cloudSync ? "is-active" : ""}`} onClick={() => setCloudSync(false)}>
              <HardDrive size={16} />
              <span><strong>This device only</strong><small>Nothing leaves your computer</small></span>
            </button>
          </div> : <p className="quiet signin-hint"><HardDrive size={12} /> Your workspace is saved in this browser. Get the desktop app for Google Drive sync and editing Drive files.</p>}

          {error && <p className="signin-error">{error}</p>}

          {!isDesktop && !webClientId && <p className="signin-note">Google sign-in isn't configured for this site yet (VITE_GOOGLE_CLIENT_ID).</p>}

          {needsSetup && !setupOpen && (
            <div className="signin-setup">
              <p><strong>Google sign-in isn't set up on this computer yet.</strong></p>
              <p className="quiet">Add the OAuth client for your Google Cloud project once, then everyone on this device can sign in.</p>
              <button className="btn btn-sm" onClick={() => setSetupOpen(true)}><Settings2 size={13} /> Set up Google sign-in</button>
            </div>
          )}
          {setupOpen && (
            <form className="signin-setup" onSubmit={(e) => { e.preventDefault(); saveClient(); }}>
              <label className="field">
                <span className="field-label">OAuth client (Desktop app)</span>
                <textarea className="input textarea" rows={4} spellCheck={false} value={clientJson} onChange={(e) => setClientJson(e.target.value)}
                  placeholder={'Paste the JSON downloaded from Google Cloud Console, or just the client ID\n{"installed":{"client_id":"….apps.googleusercontent.com", …}}'} />
              </label>
              <div className="field-row">
                <button className="btn btn-primary btn-sm" type="submit" disabled={!clientJson.trim()}>Save</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSetupOpen(false)}>Cancel</button>
              </div>
              <p className="quiet">Stored only in mova's config folder on this computer. See docs/AUTH.md.</p>
            </form>
          )}

          {import.meta.env.DEV && (
            <button className="link-btn signin-dev" onClick={() => import("../lib/testAccount").then((m) => m.signInTestAccount())}>
              Continue with test account (development only)
            </button>
          )}

          {!isDesktop && (
            <p className="signin-legal">Prefer an app? <a href="https://movadesktop.vercel.app/#download" target="_blank" rel="noreferrer">Download mova for desktop</a></p>
          )}
          <p className="signin-legal">
            By continuing you agree to the <a href="https://movadesktop.vercel.app/terms" target="_blank" rel="noreferrer">Terms of Use</a> and{" "}
            <a href="https://movadesktop.vercel.app/privacy" target="_blank" rel="noreferrer">Privacy Notice</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
