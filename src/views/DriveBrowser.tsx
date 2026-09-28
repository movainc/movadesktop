import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ExternalLink, FilePlus2, Folder as FolderIcon, Loader2, RefreshCw, Search, X } from "lucide-react";
import { isDesktop } from "../lib/ai";
import { authStatus } from "../lib/auth";
import { connectDriveFiles, createDrive, isEditable, listDrive, openDriveFile, type DriveFile } from "../lib/gdrive";
import { relativeAgo } from "../lib/dates";
import { useSession } from "../lib/session";
import { Empty, Field, FileIcon, Modal, fmtSize } from "../components/ui";
import { GoogleDriveLogo } from "../components/GoogleDriveLogo";
import { openExternal } from "../lib/links";

type Crumb = { id: string; name: string };

export function DriveBrowser() {
  const account = useSession((s) => s.account);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [path, setPath] = useState<Crumb[]>([{ id: "root", name: "My Drive" }]);
  const [items, setItems] = useState<DriveFile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const folder = path[path.length - 1];

  useEffect(() => {
    if (isDesktop && account?.provider === "google") authStatus().then((s) => setConnected(!!s?.drive_files)).catch(() => setConnected(false));
    else setConnected(false);
  }, [account]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listDrive(folder.id, query || undefined));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [folder.id, query]);

  useEffect(() => {
    if (!connected) return;
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [connected, load, query]);

  const open = async (f: DriveFile) => {
    if (f.is_folder) { setQuery(""); setPath([...path, { id: f.id, name: f.name }]); return; }
    if (!isEditable(f)) { if (f.web_view_link) openExternal(f.web_view_link); return; }
    setBusyId(f.id);
    setError("");
    try { await openDriveFile(f); } catch (e) { setError(String(e)); } finally { setBusyId(null); }
  };

  if (!isDesktop || account?.provider !== "google") {
    return (
      <Empty
        icon={<GoogleDriveLogo size={22} />}
        title="Google Drive works in the desktop app"
        hint={isDesktop ? "Sign in with Google to browse and edit your Drive files." : "Download mova for desktop to open and edit files inside your Google Drive."}
      />
    );
  }

  if (connected === false) {
    return (
      <div className="drive-connect">
        <GoogleDriveLogo size={40} />
        <h3>Edit files inside your Google Drive</h3>
        <p>Browse your Drive, open code and text files in mova's editor, and save changes straight back to Drive.</p>
        <button className="btn btn-primary" onClick={async () => {
          setError("");
          try { const s = await connectDriveFiles(); setConnected(s.drive_files); } catch (e) { setError(String(e)); }
        }}>Connect Google Drive</button>
        <p className="quiet">You'll be asked to allow access in your browser. You can remove it any time from your Google Account.</p>
        {error && <p className="signin-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="drive">
      <div className="drive-bar">
        <nav className="crumbs drive-crumbs">
          {path.map((c, i) => (
            <span key={c.id} className="crumb">
              {i > 0 && <ChevronRight size={13} />}
              <button onClick={() => { setQuery(""); setPath(path.slice(0, i + 1)); }}>{c.name}</button>
            </span>
          ))}
        </nav>
        <span className="push" />
        <label className="search-field">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Drive" />
          {query && <button className="icon-btn icon-btn-xs" onClick={() => setQuery("")} aria-label="Clear"><X size={12} /></button>}
        </label>
        <button className="btn" onClick={() => setCreating(true)}><FilePlus2 size={14} /> New file</button>
        <button className="icon-btn" onClick={load} aria-label="Refresh"><RefreshCw size={15} className={loading ? "spin" : ""} /></button>
      </div>
      {error && <p className="signin-error">{error}</p>}
      {connected === null || (loading && !items.length) ? (
        <div className="drive-loading"><Loader2 size={16} className="spin" /> Loading your Drive…</div>
      ) : items.length === 0 ? (
        <Empty icon={<FolderIcon size={22} />} title={query ? "No matches" : "This folder is empty"} />
      ) : (
        <div className="file-table" role="table">
          <div className="file-row file-row-head drive-row" role="row"><span>Name</span><span>Modified</span><span className="num">Size</span><span /></div>
          {items.map((f) => (
            <div key={f.id} role="row" className="file-row drive-row" onClick={() => open(f)}>
              <span className="file-name">
                {f.is_folder ? <FolderIcon size={16} className="drive-folder" /> : <FileIcon name={f.name} />}
                {f.name}
                {busyId === f.id && <Loader2 size={13} className="spin" />}
              </span>
              <span className="quiet">{f.modified_time ? relativeAgo(f.modified_time) : ""}</span>
              <span className="quiet num">{f.size != null ? fmtSize(f.size) : "—"}</span>
              <span className="drive-action">
                {!f.is_folder && (isEditable(f) ? <span className="chip chip-sm">Edit</span> : <ExternalLink size={13} />)}
              </span>
            </div>
          ))}
        </div>
      )}
      {creating && <NewDriveFile parent={folder.id} onClose={() => setCreating(false)} onCreated={load} />}
    </div>
  );
}

function NewDriveFile({ parent, onClose, onCreated }: { parent: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    if (!name.trim()) return;
    try {
      const id = await createDrive(name.trim(), parent, "");
      onClose();
      onCreated();
      await openDriveFile({ id, name: name.trim(), mime_type: "text/plain", modified_time: new Date().toISOString(), size: 0, is_folder: false, web_view_link: null });
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <Modal title="New file in Google Drive" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={submit}>Create</button></>}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="File name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. notes.md" /></Field>
        {error && <p className="signin-error">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
