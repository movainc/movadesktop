import { invoke } from "@tauri-apps/api/core";
import { DATA_KEYS, useStore } from "./store";
import { useSession } from "./session";

type Snapshot = { savedAt: string; data: Record<string, unknown> };

const PUSH_DELAY = 3000;
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;

const snapshot = (): Snapshot => {
  const s = useStore.getState();
  return { savedAt: new Date().toISOString(), data: Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) };
};

const localSavedAtKey = () => `mova-saved-at:${useSession.getState().account?.id}`;

async function push() {
  const { setSync } = useSession.getState();
  setSync("syncing");
  try {
    const snap = snapshot();
    await invoke("drive_push", { content: JSON.stringify(snap) });
    localStorage.setItem(localSavedAtKey(), snap.savedAt);
    setSync("idle", { lastSyncedAt: snap.savedAt, syncError: undefined });
  } catch (e) {
    setSync("error", { syncError: String(e) });
  }
}

export async function syncNow() {
  clearTimeout(timer);
  await push();
}

// Pulls the Drive copy (newest wins), then pushes local changes a few seconds after they happen.
export async function startSync() {
  const { setSync } = useSession.getState();
  setSync("syncing");
  try {
    const remote = await invoke<{ content: string; modified_time: string } | null>("drive_pull");
    const localSavedAt = localStorage.getItem(localSavedAtKey()) ?? "";
    if (remote) {
      const snap = JSON.parse(remote.content) as Snapshot;
      if (snap.savedAt > localSavedAt) {
        applyingRemote = true;
        useStore.setState(snap.data as Partial<ReturnType<typeof useStore.getState>>);
        applyingRemote = false;
        localStorage.setItem(localSavedAtKey(), snap.savedAt);
        setSync("idle", { lastSyncedAt: snap.savedAt, syncError: undefined });
      } else {
        await push();
      }
    } else {
      await push();
    }
  } catch (e) {
    setSync("error", { syncError: String(e) });
  }

  unsubscribe = useStore.subscribe((state, prev) => {
    if (applyingRemote || !DATA_KEYS.some((k) => state[k] !== prev[k])) return;
    localStorage.setItem(localSavedAtKey(), new Date().toISOString());
    clearTimeout(timer);
    timer = setTimeout(push, PUSH_DELAY);
  });
}

export function stopSync() {
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = null;
}
