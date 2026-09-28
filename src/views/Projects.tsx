import { useState } from "react";
import { FileText, Folder, LayoutGrid, Plus, Star } from "lucide-react";
import { useStore } from "../lib/store";
import { PROJECT_COLORS } from "../lib/seed";
import { dueLabel, fromDateInput } from "../lib/dates";
import type { Area } from "../lib/types";
import { Empty, Field, Modal } from "../components/ui";
import { IconGrid, ProjectBadge } from "../components/ProjectIcon";

export const AREAS: Area[] = ["School", "Work", "Personal", "Content", "Side projects"];

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const addProject = useStore((s) => s.addProject);
  const go = useStore((s) => s.go);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<Area>("Personal");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState<string | undefined>();

  const create = () => {
    if (!name.trim()) return;
    const p = addProject({ name: name.trim(), description, area, deadline: fromDateInput(deadline), color, icon });
    onClose();
    go({ name: "project", id: p.id });
  };

  return (
    <Modal
      title="New project"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={create} disabled={!name.trim()}>Create project</button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); create(); }} className="form">
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Robotics" />
        </Field>
        <Field label="Description">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
        </Field>
        <div className="form-row">
          <Field label="Area">
            <select className="select" value={area} onChange={(e) => setArea(e.target.value as Area)}>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Deadline">
            <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        <Field label="Colour">
          <div className="swatches">
            {PROJECT_COLORS.map((c) => (
              <button type="button" key={c} className={`swatch ${c === color ? "is-active" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Colour ${c}`} />
            ))}
          </div>
        </Field>
        <Field label="Icon">
          <div className="icon-field">
            <ProjectBadge project={{ name: name || "?", color, icon }} size={40} />
            <IconGrid value={icon} color={color} onChange={setIcon} />
          </div>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function Projects({ onNewProject }: { onNewProject: () => void }) {
  const { projects, tasks, notes, files, go, updateProject } = useStore();
  const [area, setArea] = useState<Area | "All">("All");
  const areas = AREAS.filter((a) => projects.some((p) => p.area === a));
  const shown = projects.filter((p) => area === "All" || p.area === area);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-sub">Everything for what you're working on.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onNewProject}><Plus size={15} /> New project</button>
        </div>
      </header>

      <div className="tabs">
        {(["All", ...areas] as const).map((a) => (
          <button key={a} className={`tab ${area === a ? "is-active" : ""}`} onClick={() => setArea(a)}>
            {a}
            <span className="tab-count">{a === "All" ? projects.length : projects.filter((p) => p.area === a).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty icon={<LayoutGrid size={22} />} title="No projects yet" hint="Projects keep tasks, notes and files together." action={<button className="btn btn-primary" onClick={onNewProject}><Plus size={15} /> New project</button>} />
      ) : (
        <div className="project-grid">
          {shown.map((p) => {
            const pt = tasks.filter((t) => t.projectId === p.id);
            const done = pt.filter((t) => t.done).length;
            const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
            const next = pt.filter((t) => !t.done).sort((a, b) => (a.due ?? "z").localeCompare(b.due ?? "z"))[0];
            return (
              <article key={p.id} className="project-card" onClick={() => go({ name: "project", id: p.id })}>
                <header className="project-card-head">
                  <ProjectBadge project={p} size={32} />
                  <button
                    className={`icon-btn star ${p.starred ? "is-on" : ""}`}
                    aria-label={p.starred ? "Unstar" : "Star"}
                    onClick={(e) => { e.stopPropagation(); updateProject(p.id, { starred: !p.starred }); }}
                  >
                    <Star size={14} />
                  </button>
                </header>
                <h3 className="project-card-title">{p.name}</h3>
                <p className="project-card-desc">{p.description || p.area}</p>
                <div className="project-card-next">{next ? <>Next: {next.title}</> : <span className="quiet">No open tasks</span>}</div>
                <div className="progress"><span style={{ width: `${pct}%`, background: p.color }} /></div>
                <footer className="project-card-foot">
                  <span>{done}/{pt.length} tasks</span>
                  <span><FileText size={12} /> {notes.filter((n) => n.projectId === p.id).length}</span>
                  <span><Folder size={12} /> {files.filter((f) => f.projectId === p.id).length}</span>
                  {p.deadline && <span className="push">{dueLabel(p.deadline)}</span>}
                </footer>
              </article>
            );
          })}
          <button className="project-card project-card-new" onClick={onNewProject}>
            <Plus size={18} />
            <span>New project</span>
          </button>
        </div>
      )}
    </div>
  );
}
