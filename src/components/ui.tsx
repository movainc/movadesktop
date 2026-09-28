import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Calendar as CalendarIcon, Check, Plus, Trash2, X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { dueLabel, daysFromToday, fmtTime, fromDateInput, toDateInput } from "../lib/dates";
import type { FileKind, ID, Task } from "../lib/types";

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? (checked ? "Mark incomplete" : "Mark complete")}
      className={`checkbox ${checked ? "is-checked" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  );
}

export function Section({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`section ${className}`}>
      <header className="section-head">
        <h2 className="section-title">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function ProjectDot({ color, size = 8 }: { color: string; size?: number }) {
  return <span className="dot" style={{ background: color, width: size, height: size }} />;
}

export function ProjectTag({ projectId }: { projectId?: ID }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const go = useStore((s) => s.go);
  if (!project) return null;
  return (
    <button
      className="tag"
      onClick={(e) => {
        e.stopPropagation();
        go({ name: "project", id: project.id });
      }}
    >
      <ProjectDot color={project.color} size={6} />
      {project.name}
    </button>
  );
}

export function DueBadge({ iso, done }: { iso?: string; done?: boolean }) {
  if (!iso) return null;
  const n = daysFromToday(iso);
  const tone = done ? "" : n < 0 ? "is-overdue" : n === 0 ? "is-today" : "";
  return (
    <span className={`due ${tone}`}>
      <CalendarIcon size={11} />
      {dueLabel(iso)}
    </span>
  );
}

export function TaskRow({ task, showProject = true, onOpen }: { task: Task; showProject?: boolean; onOpen?: (t: Task) => void }) {
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  return (
    <div className={`task-row ${task.done ? "is-done" : ""}`} onClick={() => onOpen?.(task)} draggable onDragStart={(e) => e.dataTransfer.setData("text/mova-task", task.id)}>
      <Checkbox checked={task.done} onChange={() => toggleTask(task.id)} />
      <span className="task-title">{task.title}</span>
      <span className="task-meta">
        {task.scheduledStart && !task.done && <span className="time-pill">{fmtTime(task.scheduledStart)}</span>}
        {showProject && <ProjectTag projectId={task.projectId} />}
        <DueBadge iso={task.due} done={task.done} />
      </span>
      <button
        className="icon-btn row-action"
        aria-label="Delete task"
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task.id);
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function QuickAddTask({ projectId, due, placeholder = "Add a task", autoFocus }: { projectId?: ID; due?: string; placeholder?: string; autoFocus?: boolean }) {
  const addTask = useStore((s) => s.addTask);
  const projects = useStore((s) => s.projects);
  const [title, setTitle] = useState("");
  const [pid, setPid] = useState<ID | "">(projectId ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(due));

  const submit = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), projectId: pid || undefined, due: fromDateInput(dueDate) });
    setTitle("");
  };

  return (
    <form
      className="quick-add"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Plus size={15} className="quick-add-icon" />
      <input className="quick-add-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
      {title && (
        <>
          {!projectId && (
            <select className="select select-sm" value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Project">
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <input type="date" className="input input-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
          <button className="btn btn-primary btn-sm" type="submit">Add</button>
        </>
      )}
    </form>
  );
}

export function Empty({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" ref={ref} role="dialog" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export { FileTypeIcon as FileIcon } from "./FileTypeIcon";

export function kindFromName(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "txt", "md", "pages", "key", "ppt", "pptx", "rtf"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "image";
  if (["py", "ts", "tsx", "js", "rs", "c", "cpp", "java", "go", "json", "html", "css", "sh"].includes(ext)) return "code";
  if (["csv", "xls", "xlsx", "numbers"].includes(ext)) return "sheet";
  if (["mp4", "mov", "mkv", "webm"].includes(ext)) return "video";
  return "other";
}

export function fmtSize(bytes: number) {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? "⌘" : "Ctrl";
