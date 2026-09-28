import { invoke } from "@tauri-apps/api/core";
import { isDesktop } from "./ai";
import { bindWorkspace } from "./store";
import { useSession, type Account } from "./session";
import { startSync, stopSync } from "./sync";

export type Profile = { sub: string; name: string; email: string; picture?: string | null };
export type AuthStatus = { configured: boolean; client_source: "env" | "saved" | null; profile: Profile | null; drive: boolean; drive_files: boolean };

const toAccount = (p: Profile): Account => ({ id: `google-${p.sub}`, provider: "google", name: p.name, email: p.email, picture: p.picture ?? undefined });

export async function authStatus(): Promise<AuthStatus | null> {
  if (!isDesktop) return null;
  return invoke<AuthStatus>("auth_status");
}

export async function configureGoogle(clientJson: string): Promise<AuthStatus> {
  return invoke<AuthStatus>("auth_configure_google", { clientJson });
}

export async function forgetGoogleClient(): Promise<AuthStatus> {
  return invoke<AuthStatus>("auth_forget_google_client");
}

async function activate(account: Account | null, drive = false) {
  stopSync();
  useSession.getState().setAccount(account);
  await bindWorkspace(account?.id ?? null);
  if (account?.provider === "google" && drive && useSession.getState().cloudSync) await startSync();
  else useSession.getState().setSync("off");
}

export async function signInWithGoogle() {
  const withDrive = useSession.getState().cloudSync;
  const profile = await invoke<Profile>("auth_sign_in_google", { withDrive, driveFiles: false });
  await activate(toAccount(profile), withDrive);
}

// Web build: Google Identity Services returns a signed ID token; the profile is read from it.
// The web app keeps data in this browser only, so no server-side verification is involved.
export async function signInWithGoogleCredential(credential: string) {
  const payload = JSON.parse(decodeURIComponent(escape(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
  if (payload.aud !== import.meta.env.VITE_GOOGLE_CLIENT_ID || payload.exp * 1000 < Date.now()) throw new Error("Google sign-in response was not valid.");
  await activate({ id: `google-${payload.sub}`, provider: "google-web", name: payload.name ?? payload.email, email: payload.email, picture: payload.picture });
}

export const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export async function signOut() {
  if (isDesktop) await invoke("auth_sign_out").catch(() => {});
  await activate(null);
}

// Restores the session at launch. On desktop the native session is the source of truth; in a plain browser
// (development, screenshots) only a locally stored test account can be restored.
export async function restoreSession() {
  const session = useSession.getState();
  if (isDesktop) {
    const status = await authStatus().catch(() => null);
    await activate(status?.profile ? toAccount(status.profile) : null, status?.drive);
  } else {
    const a = session.account;
    await activate(a && (a.provider === "test" || a.provider === "google-web") ? a : null);
  }
  useSession.getState().setReady(true);
}
