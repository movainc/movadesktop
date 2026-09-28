import { ROOT_FOLDER } from "../lib/seed";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { ChevronDown, ChevronRight, Code2, FilePlus2, Loader2, X } from "lucide-react";
import "../lib/monaco";
import { LANGUAGE_LABELS, languageFor } from "../lib/monaco";
import { useStore } from "../lib/store";
import { useSession } from "../lib/session";
import { writeDrive } from "../lib/gdrive";
import { GoogleDriveLogo } from "../components/GoogleDriveLogo";
import type { FileItem, ID } from "../lib/types";
import { Empty, Field, FileIcon, Modal, ProjectDot, kindFromName } from "../components/ui";

export const isTextFile = (f: FileItem) => typeof f.content === "string";

function useResolvedDark() {
  const theme = useSession((s) => s.theme);
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return theme === "dark" || (theme === "system" && systemDark);
}

export default function Code() {
  const view = useStore((s) => s.view);
  const files = useStore((s) => s.files);
  const projects = useStore((s) => s.projects);
  const { updateFile, addFiles, go, touch } = useStore.getState();
  const dark = useResolvedDark();

  const textFiles = useMemo(() => files.filter(isTextFile).sort((a, b) => a.name.localeCompare(b.name)), [files]);
  const requested = view.name === "code" ? view.fileId : undefined;
  const [tabs, setTabs] = useState<ID[]>(() => {
    const initial = requested ?? (textFiles.find((f) => f.starred) ?? textFiles[0])?.id;
    return initial ? [initial] : [];
  });
  const activeId = requested && tabs.includes(requested) ? requested : tabs[tabs.length - 1];
  const active = files.find((f) => f.id === activeId);

  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [saveError, setSaveError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (requested && !tabs.includes(requested)) setTabs((t) => [...t, requested]);
    if (requested) touch("file", requested);
  }, [requested]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (id: ID) => go({ name: "code", fileId: id });
  const closeTab = (id: ID) => {
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (id === activeId) go({ name: "code", fileId: next[next.length - 1] });
  };

  const onChange = (value?: string) => {
    if (!active || value === undefined) return;
    setSaveState("saving");
    clearTimeout(timer.current);
    const file = active;
    timer.current = setTimeout(async () => {
      updateFile(file.id, { content: value, size: new Blob([value]).size, updatedAt: new Date().toISOString() });
      if (file.driveId) {
        try {
          await writeDrive(file.driveId, value);
        } catch (e) {
          setSaveState("error");
          setSaveError(String(e));
          return;
        }
      }
      setSaveState("saved");
    }, file.driveId ? 1000 : 400);
  };

  const onMount: OnMount = (editor, monaco) => {
    // Keep mova's global shortcuts working while the editor has focus (Monaco uses Ctrl/Cmd+K as a chord prefix).
    const s = useStore.getState;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => s().setSearchOpen(true));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => s().aiEnabled && s().setAssistantOpen(!s().assistantOpen));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => s().startFocus({ projectId: active?.projectId }));
    editor.onDidChangeCursorPosition((e) => setCursor({ line: e.position.lineNumber, col: e.position.column }));
    editor.focus();
  };

  const groups = [
    ...projects.map((p) => ({ key: p.id, label: p.name, color: p.color, items: textFiles.filter((f) => f.projectId === p.id) })),
    { key: "drive", label: "Google Drive", color: "#2684fc", items: textFiles.filter((f) => !f.projectId && f.driveId) },
    { key: "none", label: "Unsorted", color: "var(--faint)", items: textFiles.filter((f) => !f.projectId && !f.driveId) },
  ].filter((g) => g.items.length);

  const language = active ? languageFor(active.name) : "plaintext";

  return (
    <div className="split code-layout">
      <aside className="subnav code-explorer">
        <div className="code-explorer-head">
          <p className="subnav-title">Explorer</p>
          <button className="icon-btn icon-btn-xs" onClick={() => setCreating(true)} aria-label="New file"><FilePlus2 size={14} /></button>
        </div>
        {groups.map((g) => (
          <div key={g.key} className="code-group">
            <button className="tree-item code-group-label" onClick={() => setCollapsed({ ...collapsed, [g.key]: !collapsed[g.key] })}>
              <span className="tree-caret">{collapsed[g.key] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}</span>
              <ProjectDot color={g.color} size={7} />
              <span>{g.label}</span>
            </button>
            {!collapsed[g.key] && g.items.map((f) => (
              <button key={f.id} className={`tree-item code-file ${f.id === activeId ? "is-active" : ""}`} onClick={() => open(f.id)}>
                <FileIcon name={f.name} size={14} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        ))}
        <p className="code-credit">
          Editor powered by <a href="https://github.com/microsoft/monaco-editor" target="_blank" rel="noreferrer">Monaco</a>, the open-source core of{" "}
          <a href="https://github.com/microsoft/vscode" target="_blank" rel="noreferrer">Code - OSS</a>. MIT License © Microsoft.
        </p>
      </aside>

      <section className="code-main">
        <div className="code-tabs" role="tablist">
          {tabs.map((id) => {
            const f = files.find((x) => x.id === id);
            if (!f) return null;
            return (
              <div key={id} role="tab" aria-selected={id === activeId} className={`code-tab ${id === activeId ? "is-active" : ""}`} onClick={() => open(id)}>
                <FileIcon name={f.name} size={13} />
                <span>{f.name}</span>
                <button className="icon-btn icon-btn-xs" onClick={(e) => { e.stopPropagation(); closeTab(id); }} aria-label={`Close ${f.name}`}><X size={12} /></button>
              </div>
            );
          })}
        </div>

        {active ? (
          <div className="code-editor">
            <Editor
              key={active.id}
              path={`mova://${active.id}/${active.name}`}
              defaultValue={active.content ?? ""}
              language={language}
              theme={dark ? "mova-dark" : "mova-light"}
              onChange={onChange}
              onMount={onMount}
              loading={<div className="code-loading"><Loader2 size={16} className="spin" /> Loading editor…</div>}
              options={{
                fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
                fontSize: 13,
                lineHeight: 21,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: "line",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                tabSize: language === "python" ? 4 : 2,
                automaticLayout: true,
                scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
              }}
            />
          </div>
        ) : (
          <Empty icon={<Code2 size={22} />} title="No file open" hint="Pick a file from the explorer or create a new one." action={<button className="btn btn-primary" onClick={() => setCreating(true)}><FilePlus2 size={14} /> New file</button>} />
        )}

        <footer className="code-status">
          {active && (
            <>
              <span className="code-status-source">
                {active.driveId && <GoogleDriveLogo size={12} />}
                {active.driveId ? "Google Drive" : projects.find((p) => p.id === active.projectId)?.name ?? "Unsorted"}
              </span>
              <span className="push" />
              <span>Ln {cursor.line}, Col {cursor.col}</span>
              <span>{LANGUAGE_LABELS[language] ?? language}</span>
              <span>UTF-8</span>
              <span className={saveState === "saving" ? "is-saving" : saveState === "error" ? "is-error" : ""} title={saveState === "error" ? saveError : undefined}>
                {saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save to Drive" : active.driveId ? "Saved to Drive" : "Saved"}
              </span>
            </>
          )}
        </footer>
      </section>

      {creating && (
        <NewFileModal
          onClose={() => setCreating(false)}
          onCreate={(name, projectId) => {
            addFiles([{ name, kind: kindFromName(name), size: 0, folderId: ROOT_FOLDER, projectId, content: "" }]);
            const all = useStore.getState().files;
            const created = all[all.length - 1];
            if (created) open(created.id);
          }}
        />
      )}
    </div>
  );
}

function NewFileModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, projectId?: ID) => void }) {
  const projects = useStore((s) => s.projects);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), projectId || undefined);
    onClose();
  };
  return (
    <Modal title="New file" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={submit}>Create</button></>}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="File name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. main.py" /></Field>
        <Field label="Project">
          <select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
