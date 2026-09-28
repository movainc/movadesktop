import { useEffect, useRef, useState } from "react";
import { AlertCircle, Cloud, CloudOff, GraduationCap, HardDrive, Loader2, LogOut, RefreshCw, Settings } from "lucide-react";
import { useSession } from "../lib/session";
import { useStore } from "../lib/store";
import { signOut } from "../lib/auth";
import { syncNow } from "../lib/sync";
import { relativeAgo } from "../lib/dates";
import { GoogleG } from "../views/SignIn";

export function Avatar({ name, picture, size = 26 }: { name: string; picture?: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return picture && !broken ? (
    <img className="avatar" src={picture} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  ) : (
    <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>
  );
}

export function SyncBadge() {
  const { syncState, lastSyncedAt, account } = useSession();
  if (account?.provider !== "google") return <span className="sync-badge"><HardDrive size={12} /> On this device</span>;
  if (syncState === "off") return <span className="sync-badge"><CloudOff size={12} /> Sync off</span>;
  if (syncState === "syncing") return <span className="sync-badge"><Loader2 size={12} className="spin" /> Syncing…</span>;
  if (syncState === "error") return <span className="sync-badge is-error"><AlertCircle size={12} /> Sync problem</span>;
  return <span className="sync-badge is-ok"><Cloud size={12} /> Synced{lastSyncedAt ? ` ${relativeAgo(lastSyncedAt).toLowerCase()}` : ""}</span>;
}

export function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const account = useSession((s) => s.account)!;
  const syncState = useSession((s) => s.syncState);
  const syncError = useSession((s) => s.syncError);
  const go = useStore((s) => s.go);
  const startTour = useStore((s) => s.startTour);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  const item = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div className="account" ref={ref}>
      <button className={`account-trigger ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title={collapsed ? account.name : undefined}>
        <Avatar name={account.name} picture={account.picture} />
        {!collapsed && (
          <span className="account-text">
            <span className="account-name">{account.name}</span>
            <SyncBadge />
          </span>
        )}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">
            <Avatar name={account.name} picture={account.picture} size={36} />
            <div>
              <p className="account-name">{account.name}</p>
              <p className="quiet">{account.email}</p>
            </div>
          </div>
          <div className="account-menu-provider">
            {account.provider === "test" ? <span className="chip chip-sm">Test account</span> : <><GoogleG size={13} /> Signed in with Google</>}
          </div>
          {syncState === "error" && syncError && <p className="account-menu-error">{syncError}</p>}
          <div className="account-menu-sep" />
          {account.provider === "google" && syncState !== "off" && (
            <button role="menuitem" className="menu-item" onClick={item(syncNow)}><RefreshCw size={14} /> Sync now</button>
          )}
          <button role="menuitem" className="menu-item" onClick={item(() => go({ name: "settings" }))}><Settings size={14} /> Settings</button>
          <button role="menuitem" className="menu-item" onClick={item(startTour)}><GraduationCap size={14} /> Take the tour</button>
          <div className="account-menu-sep" />
          <button role="menuitem" className="menu-item menu-item-danger" onClick={item(signOut)}><LogOut size={14} /> Sign out</button>
        </div>
      )}
    </div>
  );
}
