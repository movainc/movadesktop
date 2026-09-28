import { ROOT_FOLDER } from "../lib/seed";
import { useState } from "react";
import { ChevronRight, ExternalLink, FileText, Link2, Plus, Share2, Star, Target, Trash2, Upload } from "lucide-react";
import { useStore } from "../lib/store";
import { daysFromToday, dueLabel, fmtDate, fmtTime, fromDateInput, relativeAgo, toDateInput } from "../lib/dates";
import type { ID, ProjectTab } from "../lib/types";
import { Empty, QuickAddTask, Section, TaskRow } from "../components/ui";
import { TaskPanel } from "../components/TaskPanel";
import { IconPickerButton } from "../components/ProjectIcon";
import { FileTable, useFileUpload } from "./Files";
import { AREAS } from "./Projects";

const TABS: { id: ProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "files", label: "Files" },
  { id: "calendar", label: "Calendar" },
  { id: "links", label: "Links" },
];

export function ProjectDetail({ id, tab = "overview" }: { id: ID; tab?: ProjectTab }) {
  const s = useStore();
  const project = s.projects.find((p) => p.id === id);
  const [openTask, setOpenTask] = useState<ID | null>(null);
  const [showDone, setShowDone] = useState(false);
  const upload = useFileUpload({ projectId: id, folderId: ROOT_FOLDER });

  if (!project) return <div className="page"><Empty title="Project not found" /></div>;

  const tasks = s.tasks.filter((t) => t.projectId === id);
  const open = tasks.filter((t) => !t.done).sort((a, b) => (a.due ?? "z").localeCompare(b.due ?? "z"));
  const done = tasks.filter((t) => t.done);
  const notes = s.notes.filter((n) => n.projectId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const files = s.files.filter((f) => f.projectId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const links = s.links.filter((l) => l.projectId === id);
  const agenda = [
    ...(project.deadline ? [{ id: "deadline", title: `${project.name} due`, when: project.deadline, time: "", strong: true }] : []),
    ...s.events.filter((e) => e.projectId === id).map((e) => ({ id: e.id, title: e.title, when: e.start, time: `${fmtTime(e.start)} – ${fmtTime(e.end)}`, strong: false })),
    ...open.filter((t) => t.scheduledStart).map((t) => ({ id: t.id, title: t.title, when: t.scheduledStart!, time: `${fmtTime(t.scheduledStart!)} – ${fmtTime(t.scheduledEnd!)}`, strong: false })),
  ].filter((a) => daysFromToday(a.when) >= 0).sort((a, b) => a.when.localeCompare(b.when));

  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const counts: Record<ProjectTab, number | undefined> = { overview: undefined, tasks: open.length, notes: notes.length, files: files.length, calendar: agenda.length, links: links.length };
  const setTab = (t: ProjectTab) => s.go({ name: "project", id, tab: t });

  const newNote = () => {
    const n = s.addNote({ projectId: id, title: "" });
    s.go({ name: "notes", id: n.id });
  };

  const noteList = (limit?: number) =>
    notes.length === 0 ? <p className="quiet">No notes yet.</p> : (
      <ul className="item-list">
        {notes.slice(0, limit).map((n) => (
          <li key={n.id} onClick={() => s.go({ name: "notes", id: n.id })}>
            <FileText size={14} className="item-icon" />
            <span className="item-title">{n.title || "Untitled"}</span>
            <span className="item-sub">{relativeAgo(n.updatedAt)}</span>
          </li>
        ))}
      </ul>
    );

  const agendaList = (limit?: number) =>
    agenda.length === 0 ? <p className="quiet">Nothing coming up.</p> : (
      <ul className="agenda">
        {agenda.slice(0, limit).map((a) => (
          <li key={a.id} className={a.strong ? "is-strong" : ""}>
            <span className="agenda-date">
              <span className="agenda-day">{fmtDate(a.when, { day: "numeric" })}</span>
              <span className="agenda-month">{fmtDate(a.when, { month: "short" })}</span>
            </span>
            <span className="agenda-body">
              <span className="agenda-title">{a.title}</span>
              <span className="agenda-sub">{dueLabel(a.when)}{a.time && ` · ${a.time}`}</span>
            </span>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="split">
      <div className="page">
        <nav className="crumbs">
          <button onClick={() => s.go({ name: "projects" })}>Projects</button>
          <ChevronRight size={13} />
          <span>{project.area}</span>
        </nav>

        <header className="page-header project-header">
          <div className="project-title-block">
            <IconPickerButton project={project} onChange={(icon) => s.updateProject(id, { icon })} />
            <div>
              <input className="title-input" value={project.name} onChange={(e) => s.updateProject(id, { name: e.target.value })} aria-label="Project name" />
              <input className="desc-input" value={project.description} placeholder="Add a description" onChange={(e) => s.updateProject(id, { description: e.target.value })} aria-label="Description" />
            </div>
          </div>
          <div className="page-actions">
            <button className={`icon-btn star ${project.starred ? "is-on" : ""}`} onClick={() => s.updateProject(id, { starred: !project.starred })} aria-label="Star project"><Star size={16} /></button>
            <button className="btn" disabled title="Sharing arrives with mova accounts and sync"><Share2 size={14} /> Share</button>
            <button className="btn btn-primary" onClick={() => s.startFocus({ projectId: id, taskId: open[0]?.id })}><Target size={15} /> Focus</button>
          </div>
        </header>

        <div className="project-meta">
          <label className="meta-item">
            <span className="meta-label">Area</span>
            <select className="select select-bare" value={project.area} onChange={(e) => s.updateProject(id, { area: e.target.value as typeof project.area })}>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="meta-item">
            <span className="meta-label">Deadline</span>
            <input type="date" className="input input-bare" value={toDateInput(project.deadline)} onChange={(e) => s.updateProject(id, { deadline: fromDateInput(e.target.value) })} />
          </label>
          <div className="meta-item meta-progress">
            <span className="meta-label">Progress</span>
            <span className="progress progress-inline"><span style={{ width: `${pct}%`, background: project.color }} /></span>
            <span className="meta-value">{pct}%</span>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? "is-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {counts[t.id] !== undefined && <span className="tab-count">{counts[t.id]}</span>}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="overview-grid">
            <Section title="Tasks" className="span-2" action={<button className="link-btn" onClick={() => setTab("tasks")}>View all</button>}>
              <div className="task-list">
                {open.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} showProject={false} onOpen={(task) => setOpenTask(task.id)} />)}
                <QuickAddTask projectId={id} />
              </div>
            </Section>
            <Section title="Coming up">{agendaList(4)}</Section>
            <Section title="Notes" action={<button className="icon-btn icon-btn-xs" onClick={newNote} aria-label="New note"><Plus size={13} /></button>}>{noteList(5)}</Section>
            <Section title="Files" action={<button className="icon-btn icon-btn-xs" onClick={upload.pick} aria-label="Upload"><Upload size={13} /></button>}>
              {files.length === 0 ? <p className="quiet">No files yet.</p> : <FileTable files={files.slice(0, 5)} compact />}
            </Section>
            <Section title="Links">
              {links.length === 0 ? <p className="quiet">No links yet.</p> : (
                <ul className="item-list">
                  {links.map((l) => (
                    <li key={l.id}>
                      <Link2 size={14} className="item-icon" />
                      <a className="item-title" href={l.url} target="_blank" rel="noreferrer">{l.title}</a>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}

        {tab === "tasks" && (
          <>
            <div className="task-list">
              {open.map((t) => <TaskRow key={t.id} task={t} showProject={false} onOpen={(task) => setOpenTask(task.id)} />)}
              <QuickAddTask projectId={id} autoFocus />
            </div>
            {done.length > 0 && (
              <>
                <button className="link-btn done-toggle" onClick={() => setShowDone(!showDone)}>{showDone ? "Hide" : "Show"} {done.length} completed</button>
                {showDone && <div className="task-list">{done.map((t) => <TaskRow key={t.id} task={t} showProject={false} onOpen={(task) => setOpenTask(task.id)} />)}</div>}
              </>
            )}
          </>
        )}

        {tab === "notes" && (
          <>
            <div className="toolbar"><button className="btn" onClick={newNote}><Plus size={14} /> New note</button></div>
            {notes.length === 0 ? <Empty icon={<FileText size={22} />} title="No notes" hint="Capture ideas, research and drafts here." /> : (
              <div className="note-cards">
                {notes.map((n) => (
                  <article key={n.id} className="note-card" onClick={() => s.go({ name: "notes", id: n.id })}>
                    <h4>{n.title || "Untitled"}</h4>
                    <p>{n.body.slice(0, 160)}</p>
                    <span className="quiet">{relativeAgo(n.updatedAt)}</span>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "files" && (
          <div {...upload.dropProps} className={`dropzone-wrap ${upload.dragging ? "is-dragging" : ""}`}>
            <div className="toolbar"><button className="btn" onClick={upload.pick}><Upload size={14} /> Upload files</button><span className="quiet">or drop files here</span></div>
            {files.length === 0 ? <Empty title="No files" hint="Drop files to add them to this project." /> : <FileTable files={files} />}
          </div>
        )}

        {tab === "calendar" && agendaList()}

        {tab === "links" && <LinksTab projectId={id} />}
        {upload.input}
      </div>
      {openTask && <TaskPanel taskId={openTask} onClose={() => setOpenTask(null)} />}
    </div>
  );
}

function LinksTab({ projectId }: { projectId: ID }) {
  const allLinks = useStore((s) => s.links);
  const links = allLinks.filter((l) => l.projectId === projectId);
  const { addLink, deleteLink } = useStore.getState();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const add = () => {
    if (!url.trim()) return;
    const href = /^https?:\/\//.test(url) ? url.trim() : `https://${url.trim()}`;
    addLink({ projectId, url: href, title: title.trim() || new URL(href).hostname });
    setUrl("");
    setTitle("");
  };

  return (
    <>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" />
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
        <button className="btn btn-primary" type="submit" disabled={!url.trim()}>Add link</button>
      </form>
      {links.length === 0 ? <Empty icon={<Link2 size={22} />} title="No links" hint="Keep documentation, references and sources here." /> : (
        <ul className="item-list item-list-lg">
          {links.map((l) => (
            <li key={l.id}>
              <Link2 size={14} className="item-icon" />
              <span className="item-title">{l.title}</span>
              <span className="item-sub">{l.url.replace(/^https?:\/\//, "")}</span>
              <a className="icon-btn" href={l.url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink size={14} /></a>
              <button className="icon-btn" onClick={() => deleteLink(l.id)} aria-label="Remove"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

