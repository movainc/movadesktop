import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "./types";

export interface Account {
  id: string;
  provider: "google" | "google-web" | "test";
  name: string;
  email: string;
  picture?: string;
}

export type SyncState = "off" | "idle" | "syncing" | "error";

interface SessionState {
  account: Account | null;
  ready: boolean;
  theme: Theme;
  cloudSync: boolean;
  syncState: SyncState;
  lastSyncedAt?: string;
  syncError?: string;
  setAccount: (a: Account | null) => void;
  setReady: (r: boolean) => void;
  setTheme: (t: Theme) => void;
  setCloudSync: (on: boolean) => void;
  setSync: (s: SyncState, patch?: { lastSyncedAt?: string; syncError?: string }) => void;
}

// Device-level state: who is signed in and device preferences. Workspaces are stored per account (see bindWorkspace).
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      account: null,
      ready: false,
      theme: "system",
      cloudSync: true,
      syncState: "off",
      setAccount: (account) => set({ account }),
      setReady: (ready) => set({ ready }),
      setTheme: (theme) => set({ theme }),
      setCloudSync: (cloudSync) => set({ cloudSync }),
      setSync: (syncState, patch = {}) => set({ syncState, ...patch }),
    }),
    {
      name: "mova-session",
      version: 1,
      partialize: ({ account, theme, cloudSync, lastSyncedAt }) => ({ account, theme, cloudSync, lastSyncedAt }),
    },
  ),
);
