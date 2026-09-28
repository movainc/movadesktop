import { useEffect, useRef, useState } from "react";
import { CheckSquare, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import { relativeAgo } from "../lib/dates";
import { Checkbox, Empty, ProjectDot } from "../components/ui";
import { AiSuggest } from "../components/AiSuggest";
import { suggestTasksFromNote } from "../lib/ai";

export function Notes() {
  const view = useStore((s) => s.view);
  const { notes, projects, tasks, go, addNote, updateNote, deleteNote, addTask, toggleTask, touch, aiEnabled } = useStore();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [selection, setSelection] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const sorted = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const list = sorted.filter(
    (n) => (!projectFilter || n.projectId === projectFilter) && (!query || `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase())),
  );
  const activeId = view.name === "notes" && view.id ? view.id : list[0]?.id;
  const note = notes.find((n) => n.id === activeId);
  const linkedTasks = tasks.filter((t) => t.noteId === note?.id);

  useEffect(() => {
    if (note) touch("note", note.id);
    setSelection("");
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = () => {
    const n = addNote({ projectId: projectFilter || undefined });
    go({ name: "notes", id: n.id });
  };

  const readSelection = () => {
    const el = bodyRef.current;
    if (!el) return;
    setSelection(el.value.slice(el.selectionStart, el.selectionEnd).trim());
  };

  const selectionToTask = () => {
    if (!note || !selection) return;
    const title = selection.replace(/^[-*•\d.)\s]+/, "").split("\n")[0].slice(0, 140);
    addTask({ title, projectId: note.projectId, noteId: note.id });
    setSelection("");
  };

  return (
    <div className="notes-layout">
      <aside className="notes-list">
        <div className="notes-list-head">
          <h1>Notes</h1>
          <button className="icon-btn" onClick={create} aria-label="New note"><Plus size={16} /></button>
        </div>
        <label className="search-field search-field-block">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" />
        </label>
        <select className="select select-sm notes-filter" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} aria-label="Filter by project">
          <option value="">All notes</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <ul>
          {list.map((n) => {
            const p = projects.find((x) => x.id === n.projectId);
            return (
              <li key={n.id} className={n.id === activeId ? "is-active" : ""} onClick={() => go({ name: "notes", id: n.id })}>
                <span className="note-li-title">{n.title || "Untitled"}</span>
                <span className="note-li-body">{n.body.replace(/\n+/g, " ").slice(0, 80) || "No content"}</span>
                <span className="note-li-meta">
                  {p && <><ProjectDot color={p.color} size={6} /> {p.name} · </>}
                  {relativeAgo(n.updatedAt)}
                </span>
              </li>
            );
          })}
        </ul>
        {list.length === 0 && <p className="quiet notes-empty">No notes found.</p>}
      </aside>

      {note ? (
        <article className="editor">
          <div className="editor-bar">
            <select className="select select-bare" value={note.projectId ?? ""} onChange={(e) => updateNote(note.id, { projectId: e.target.value || undefined })} aria-label="Project">
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="quiet">Edited {relativeAgo(note.updatedAt).toLowerCase()}</span>
            <span className="push" />
            {selection && (
              <button className="btn btn-sm btn-accent-soft" onMouseDown={(e) => e.preventDefault()} onClick={selectionToTask}>
                <CheckSquare size={13} /> Turn into task
              </button>
            )}
            <button className="icon-btn" onClick={() => { deleteNote(note.id); go({ name: "notes" }); }} aria-label="Delete note"><Trash2 size={15} /></button>
          </div>
          {aiEnabled && note.body.trim().length > 20 && (
            <div className="editor-ai">
              <AiSuggest
                key={note.id}
                compact
                label="Suggest tasks from this note"
                load={() => suggestTasksFromNote(note.title, note.body)}
                onAdd={(items) => items.forEach((title) => addTask({ title, projectId: note.projectId, noteId: note.id }))}
              />
            </div>
          )}
          <div className="editor-inner">
            <input className="editor-title" value={note.title} placeholder="Untitled" onChange={(e) => updateNote(note.id, { title: e.target.value })} autoFocus={!note.title} />
            <textarea
              ref={bodyRef}
              className="editor-body"
              value={note.body}
              placeholder="Start writing… Select any line to turn it into a task."
              onChange={(e) => updateNote(note.id, { body: e.target.value })}
              onSelect={readSelection}
              onBlur={() => setTimeout(() => setSelection(""), 150)}
            />
            {linkedTasks.length > 0 && (
              <div className="linked-tasks">
                <p className="section-title">Tasks from this note</p>
                {linkedTasks.map((t) => (
                  <div key={t.id} className={`task-row ${t.done ? "is-done" : ""}`}>
                    <Checkbox checked={t.done} onChange={() => toggleTask(t.id)} />
                    <span className="task-title">{t.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      ) : (
        <div className="editor"><Empty icon={<FileText size={22} />} title="No note selected" action={<button className="btn btn-primary" onClick={create}><Plus size={14} /> New note</button>} /></div>
      )}
    </div>
  );
}
