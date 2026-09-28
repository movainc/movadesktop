import { useMemo, useRef, useState, type DragEvent } from "react";
import { ChevronDown, ChevronRight, Code2, Folder as FolderIcon, FolderPlus, HardDrive, Search, Star, Trash2, Upload, X } from "lucide-react";
import { useStore } from "../lib/store";
import { fmtDate, relativeAgo } from "../lib/dates";
import type { FileItem, ID } from "../lib/types";
import { Empty, FileIcon, Field, Modal, ProjectTag, fmtSize, kindFromName } from "../components/ui";

const TEXT_EXT = /\.(py|ts|tsx|js|jsx|json|mcmeta|md|txt|html|css|scss|rs|go|java|c|h|cpp|cs|sh|ya?ml|toml|sql|csv|xml)$/i;
const isTextName = (name: string) => TEXT_EXT.test(name);

export function useFileUpload({ folderId, projectId }: { folderId: ID; projectId?: ID }) {
  const addFiles = useStore((s) => s.addFiles);
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const ingest = async (list: FileList | null) => {
    if (!list?.length) return;
    const items = await Promise.all(
      Array.from(list).map(async (f) => ({
        name: f.name, size: f.size, kind: kindFromName(f.name), folderId, projectId,
        content: isTextName(f.name) && f.size <= 1_000_000 ? await f.text() : undefined,
      })),
    );
    addFiles(items);
  };

  return {
    dragging,
    pick: () => ref.current?.click(),
    input: <input ref={ref} type="file" multiple hidden onChange={(e) => { ingest(e.target.files); e.target.value = ""; }} />,
    dropProps: {
      onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } },
      onDragLeave: (e: DragEvent) => { if (e.currentTarget === e.target) setDragging(false); },
      onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); ingest(e.dataTransfer.files); },
    },
  };
}

export function FileTable({ files, compact = false, selected, onSelect }: { files: FileItem[]; compact?: boolean; selected?: ID | null; onSelect?: (id: ID) => void }) {
  const { updateFile, touch } = useStore.getState();
  if (compact) {
    return (
      <ul className="item-list">
        {files.map((f) => (
          <li key={f.id} onClick={() => touch("file", f.id)}>
            <FileIcon kind={f.kind} size={14} />
            <span className="item-title">{f.name}</span>
            <span className="item-sub">{fmtSize(f.size)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="file-table" role="table">
      <div className="file-row file-row-head" role="row">
        <span>Name</span><span>Project</span><span>Modified</span><span className="num">Size</span><span />
      </div>
      {files.map((f) => (
        <div key={f.id} role="row" className={`file-row ${selected === f.id ? "is-selected" : ""}`} onClick={() => { onSelect?.(f.id); touch("file", f.id); }}>
          <span className="file-name"><FileIcon kind={f.kind} />{f.name}</span>
          <span><ProjectTag projectId={f.projectId} /></span>
          <span className="quiet">{relativeAgo(f.updatedAt)}</span>
          <span className="quiet num">{fmtSize(f.size)}</span>
          <button className={`icon-btn star ${f.starred ? "is-on" : ""}`} aria-label="Star" onClick={(e) => { e.stopPropagation(); updateFile(f.id, { starred: !f.starred }); }}>
            <Star size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function FolderTree({ parentId, depth, current, onOpen }: { parentId: ID; depth: number; current?: ID; onOpen: (id: ID) => void }) {
  const all = useStore((s) => s.folders);
  const folders = all.filter((f) => f.parentId === parentId);
  const [closed, setClosed] = useState<Record<ID, boolean>>({});
  return (
    <ul className="tree">
      {folders.map((f) => {
        const hasKids = all.some((c) => c.parentId === f.id);
        const isClosed = closed[f.id];
        return (
          <li key={f.id}>
            <button className={`tree-item ${current === f.id ? "is-active" : ""}`} style={{ paddingLeft: 8 + depth * 14 }} onClick={() => onOpen(f.id)}>
              <span className="tree-caret" onClick={(e) => { e.stopPropagation(); setClosed({ ...closed, [f.id]: !isClosed }); }}>
                {hasKids ? (isClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />) : null}
              </span>
              <FolderIcon size={14} />
              <span>{f.name}</span>
            </button>
            {hasKids && !isClosed && <FolderTree parentId={f.id} depth={depth + 1} current={current} onOpen={onOpen} />}
          </li>
        );
      })}
    </ul>
  );
}

export function Files() {
  const view = useStore((s) => s.view);
  const { folders, files, go, addFolder, updateFile, deleteFile, projects } = useStore();
  const folderId = (view.name === "files" && view.folderId) || (view.name === "files" && view.filter ? undefined : "root");
  const filter = view.name === "files" ? view.filter : undefined;
  const [selected, setSelected] = useState<ID | null>(null);
  const [query, setQuery] = useState("");
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const upload = useFileUpload({ folderId: folderId ?? "root" });

  const path = useMemo(() => {
    const out = [];
    let cur = folders.find((f) => f.id === folderId);
    while (cur) {
      out.unshift(cur);
      cur = folders.find((f) => f.id === cur!.parentId);
    }
    return out;
  }, [folders, folderId]);

  const subfolders = folderId && !query ? folders.filter((f) => f.parentId === folderId) : [];
  const descendantIds = (id: ID): ID[] => [id, ...folders.filter((f) => f.parentId === id).flatMap((f) => descendantIds(f.id))];

  let shown: FileItem[];
  if (query) shown = files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  else if (filter === "starred") shown = files.filter((f) => f.starred);
  else if (filter === "recent") shown = [...files].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 15);
  else shown = files.filter((f) => f.folderId === folderId);
  if (!filter) shown = [...shown].sort((a, b) => a.name.localeCompare(b.name));

  const sel = files.find((f) => f.id === selected);
  const used = files.reduce((n, f) => n + f.size, 0);
  const title = query ? "Search results" : filter === "starred" ? "Starred" : filter === "recent" ? "Recent" : path[path.length - 1]?.name ?? "Files";

  return (
    <div className="split">
      <aside className="subnav">
        <p className="subnav-title">Files</p>
        <FolderTree parentId={"root"} depth={0} current={folderId} onOpen={(id) => go({ name: "files", folderId: id })} />
        <div className="storage">
          <div className="storage-head"><HardDrive size={13} /> Storage</div>
          <div className="progress"><span style={{ width: `${Math.min(100, (used / 15e9) * 100)}%`, background: "var(--accent)" }} /></div>
          <p className="quiet">{fmtSize(used)} of 15 GB used</p>
        </div>
      </aside>

      <div className="page page-files" {...upload.dropProps}>
        {upload.dragging && <div className="drop-overlay"><Upload size={22} /> Drop to upload to {title}</div>}
        <nav className="crumbs">
          <button onClick={() => go({ name: "files" })}>Home</button>
          {path.slice(1).map((f) => (
            <span key={f.id} className="crumb"><ChevronRight size={13} /><button onClick={() => go({ name: "files", folderId: f.id })}>{f.name}</button></span>
          ))}
        </nav>
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p className="page-sub">{shown.length} {shown.length === 1 ? "file" : "files"}{subfolders.length ? ` · ${subfolders.length} ${subfolders.length === 1 ? "folder" : "folders"}` : ""}</p>
          </div>
          <div className="page-actions">
            <label className="search-field">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" />
              {query && <button className="icon-btn icon-btn-xs" onClick={() => setQuery("")} aria-label="Clear"><X size={12} /></button>}
            </label>
            {!filter && <button className="btn" onClick={() => setNewFolder(true)}><FolderPlus size={14} /> New folder</button>}
            <button className="btn btn-primary" onClick={upload.pick}><Upload size={14} /> Upload</button>
          </div>
        </header>

        {subfolders.length > 0 && (
          <div className="folder-grid">
            {subfolders.map((f) => (
              <button key={f.id} className="folder-card" onClick={() => go({ name: "files", folderId: f.id })}>
                <FolderIcon size={18} />
                <span className="folder-name">{f.name}</span>
                <span className="quiet">{(() => { const n = files.filter((x) => descendantIds(f.id).includes(x.folderId)).length; return `${n} ${n === 1 ? "file" : "files"}`; })()}</span>
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 && subfolders.length === 0 ? (
          <Empty icon={<FolderIcon size={22} />} title={filter === "starred" ? "No starred files" : "This folder is empty"} hint="Drop files anywhere on this page to upload." />
        ) : shown.length > 0 && <FileTable files={shown} selected={selected} onSelect={setSelected} />}
        {upload.input}
      </div>

      {sel && (
        <aside className="panel">
          <header className="panel-head">
            <span className="panel-kicker">File</span>
            <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Close"><X size={16} /></button>
          </header>
          <div className="file-preview"><FileIcon kind={sel.kind} size={40} /></div>
          <h3 className="panel-file-name">{sel.name}</h3>
          <dl className="props">
            <dt>Size</dt><dd>{fmtSize(sel.size)}</dd>
            <dt>Modified</dt><dd>{fmtDate(sel.updatedAt, { day: "numeric", month: "long", year: "numeric" })}</dd>
            <dt>Location</dt><dd>{folders.find((f) => f.id === sel.folderId)?.name}</dd>
          </dl>
          <div className="panel-fields">
            <Field label="Project">
              <select className="select" value={sel.projectId ?? ""} onChange={(e) => updateFile(sel.id, { projectId: e.target.value || undefined })}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          {typeof sel.content === "string" && (
            <button className="btn btn-primary" onClick={() => go({ name: "code", fileId: sel.id })}><Code2 size={14} /> Open in editor</button>
          )}
          <footer className="panel-foot">
            <button className="btn" onClick={() => updateFile(sel.id, { starred: !sel.starred })}><Star size={14} /> {sel.starred ? "Unstar" : "Star"}</button>
            <button className="btn btn-ghost btn-danger" onClick={() => { deleteFile(sel.id); setSelected(null); }}><Trash2 size={14} /> Delete</button>
          </footer>
        </aside>
      )}

      {newFolder && (
        <Modal title="New folder" onClose={() => setNewFolder(false)} footer={
          <>
            <button className="btn btn-ghost" onClick={() => setNewFolder(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!folderName.trim()} onClick={() => { addFolder(folderName.trim(), folderId ?? "root"); setFolderName(""); setNewFolder(false); }}>Create</button>
          </>
        }>
          <form onSubmit={(e) => { e.preventDefault(); if (folderName.trim()) { addFolder(folderName.trim(), folderId ?? "root"); setFolderName(""); setNewFolder(false); } }}>
            <Field label="Name"><input className="input" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Untitled folder" /></Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
