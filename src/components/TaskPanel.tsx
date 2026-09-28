import { FileText, Target, Trash2, X } from "lucide-react";
import { useStore } from "../lib/store";
import { fromDateInput, toDateInput } from "../lib/dates";
import type { ID } from "../lib/types";
import { Checkbox, Field } from "./ui";
import { AiSuggest } from "./AiSuggest";
import { breakDownTask } from "../lib/ai";

const toTimeInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function TaskPanel({ taskId, onClose }: { taskId: ID; onClose: () => void }) {
  const task = useStore((s) => s.tasks.find((t) => t.id === taskId));
  const projects = useStore((s) => s.projects);
  const note = useStore((s) => s.notes.find((n) => n.id === task?.noteId));
  const aiEnabled = useStore((s) => s.aiEnabled);
  const { updateTask, toggleTask, deleteTask, addTask, go, startFocus } = useStore.getState();
  if (!task) return null;

  const schedDate = toDateInput(task.scheduledStart);
  const setSchedule = (date: string, start: string, end: string) => {
    if (!date || !start) return updateTask(task.id, { scheduledStart: undefined, scheduledEnd: undefined });
    const s = new Date(`${date}T${start}`);
    let e = end ? new Date(`${date}T${end}`) : new Date(s.getTime() + 3_600_000);
    if (e <= s) e = new Date(s.getTime() + 3_600_000);
    updateTask(task.id, { scheduledStart: s.toISOString(), scheduledEnd: e.toISOString() });
  };

  return (
    <aside className="panel">
      <header className="panel-head">
        <Checkbox checked={task.done} onChange={() => toggleTask(task.id)} />
        <span className="panel-kicker">{task.done ? "Completed" : "Task"}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
      </header>
      <textarea className="panel-title" value={task.title} rows={2} onChange={(e) => updateTask(task.id, { title: e.target.value })} />

      <div className="panel-fields">
        <Field label="Project">
          <select className="select" value={task.projectId ?? ""} onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Due">
          <input type="date" className="input" value={toDateInput(task.due)} onChange={(e) => updateTask(task.id, { due: fromDateInput(e.target.value) })} />
        </Field>
        <Field label="Scheduled">
          <div className="field-row">
            <input type="date" className="input" value={schedDate} onChange={(e) => setSchedule(e.target.value, toTimeInput(task.scheduledStart) || "16:00", toTimeInput(task.scheduledEnd))} />
          </div>
          {schedDate && (
            <div className="field-row">
              <input type="time" className="input" value={toTimeInput(task.scheduledStart)} onChange={(e) => setSchedule(schedDate, e.target.value, toTimeInput(task.scheduledEnd))} />
              <span className="quiet">to</span>
              <input type="time" className="input" value={toTimeInput(task.scheduledEnd)} onChange={(e) => setSchedule(schedDate, toTimeInput(task.scheduledStart), e.target.value)} />
            </div>
          )}
        </Field>
        {note && (
          <Field label="From note">
            <button className="linked-item" onClick={() => go({ name: "notes", id: note.id })}>
              <FileText size={14} /> {note.title || "Untitled"}
            </button>
          </Field>
        )}
      </div>

      {aiEnabled && !task.done && (
        <AiSuggest
          key={task.id}
          label="Break into steps"
          load={() => breakDownTask(task.title, projects.find((p) => p.id === task.projectId)?.name)}
          onAdd={(items) => items.forEach((title) => addTask({ title, projectId: task.projectId, due: task.due }))}
        />
      )}

      <footer className="panel-foot">
        <button className="btn" onClick={() => startFocus({ projectId: task.projectId, taskId: task.id })}><Target size={14} /> Focus</button>
        <button className="btn btn-ghost btn-danger" onClick={() => { deleteTask(task.id); onClose(); }}><Trash2 size={14} /> Delete</button>
      </footer>
    </aside>
  );
}
