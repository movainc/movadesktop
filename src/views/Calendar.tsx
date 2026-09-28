import { useEffect, useRef, useState, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import { addDays, fmtDate, fmtTime, isSameDay, startOfWeek } from "../lib/dates";
import { Field, Modal, ProjectDot } from "../components/ui";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_PX = 52;

type Draft = { day: Date; start: string; end: string };

export function Calendar() {
  const { events, tasks, projects, updateTask, addEvent, deleteEvent, go } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const gridRef = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const now = new Date(nowTick);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    gridRef.current?.scrollTo({ top: Math.max(0, (now.getHours() - START_HOUR - 1.5) * HOUR_PX) });
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = (pid?: string) => projects.find((p) => p.id === pid)?.color ?? "var(--text-2)";
  const top = (iso: string) => {
    const d = new Date(iso);
    return (d.getHours() + d.getMinutes() / 60 - START_HOUR) * HOUR_PX;
  };
  const height = (a: string, b: string) => Math.max(22, ((new Date(b).getTime() - new Date(a).getTime()) / 3_600_000) * HOUR_PX);

  const slotFromY = (day: Date, y: number) => {
    const hours = Math.max(0, Math.min(END_HOUR - START_HOUR - 0.5, Math.round((y / HOUR_PX) * 2) / 2));
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), START_HOUR + Math.floor(hours), (hours % 1) * 60);
  };

  const onDrop = (day: Date) => (e: DragEvent<HTMLDivElement>) => {
    const id = e.dataTransfer.getData("text/mova-task");
    if (!id) return;
    e.preventDefault();
    const task = tasks.find((t) => t.id === id);
    const offset = Number(e.dataTransfer.getData("text/mova-offset") || 0);
    const rect = e.currentTarget.getBoundingClientRect();
    const start = slotFromY(day, e.clientY - rect.top - offset);
    const dur = task?.scheduledStart && task.scheduledEnd ? new Date(task.scheduledEnd).getTime() - new Date(task.scheduledStart).getTime() : 3_600_000;
    updateTask(id, { scheduledStart: start.toISOString(), scheduledEnd: new Date(start.getTime() + dur).toISOString() });
  };

  const unscheduled = tasks.filter((t) => !t.done && !t.scheduledStart);
  const weekLabel = `${fmtDate(days[0].toISOString(), { day: "numeric", month: "short" })} – ${fmtDate(days[6].toISOString(), { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="split">
      <aside className="subnav subnav-wide">
        <p className="subnav-title">Unscheduled</p>
        <p className="quiet subnav-hint">Drag a task onto the week to give it time.</p>
        <ul className="drag-list">
          {unscheduled.map((t) => (
            <li key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/mova-task", t.id)}>
              <ProjectDot color={color(t.projectId)} />
              <span>{t.title}</span>
            </li>
          ))}
        </ul>
        {unscheduled.length === 0 && <p className="quiet">Everything has a time.</p>}
      </aside>

      <div className="page page-calendar">
        <header className="page-header">
          <div>
            <h1>{fmtDate(days[3].toISOString(), { month: "long", year: "numeric" })}</h1>
            <p className="page-sub">{weekLabel}</p>
          </div>
          <div className="page-actions">
            <div className="seg">
              <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
              <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={16} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => setDraft({ day: new Date(), start: "16:00", end: "17:00" })}><Plus size={15} /> New event</button>
          </div>
        </header>

        <div className="week">
          <div className="week-head">
            <div className="gutter" />
            {days.map((d) => {
              const dues = [
                ...projects.filter((p) => p.deadline && isSameDay(new Date(p.deadline), d)).map((p) => ({ id: p.id, label: `${p.name} due`, color: p.color, pid: p.id })),
                ...tasks.filter((t) => !t.done && t.due && !t.scheduledStart && isSameDay(new Date(t.due), d)).map((t) => ({ id: t.id, label: t.title, color: color(t.projectId), pid: t.projectId })),
              ];
              return (
                <div key={d.toISOString()} className={`day-head ${isSameDay(d, now) ? "is-today" : ""}`}>
                  <span className="day-name">{fmtDate(d.toISOString(), { weekday: "short" })}</span>
                  <span className="day-num">{d.getDate()}</span>
                  <div className="all-day">
                    {dues.slice(0, 3).map((x) => (
                      <button key={x.id} className="all-day-chip" style={{ borderColor: x.color }} onClick={() => x.pid && go({ name: "project", id: x.pid })} title={x.label}>
                        {x.label}
                      </button>
                    ))}
                    {dues.length > 3 && <span className="quiet">+{dues.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="week-body" ref={gridRef}>
            <div className="week-grid" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
              <div className="gutter">
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <span key={i} className="hour-label" style={{ top: i * HOUR_PX }}>{String(START_HOUR + i).padStart(2, "0")}:00</span>
                ))}
              </div>
              {days.map((d) => {
                const dayEvents = events.filter((e) => isSameDay(new Date(e.start), d));
                const dayTasks = tasks.filter((t) => t.scheduledStart && t.scheduledEnd && isSameDay(new Date(t.scheduledStart), d));
                return (
                  <div
                    key={d.toISOString()}
                    className={`day-col ${isSameDay(d, now) ? "is-today" : ""}`}
                    onDragOver={(e) => e.dataTransfer.types.includes("text/mova-task") && e.preventDefault()}
                    onDrop={onDrop(d)}
                    onDoubleClick={(e) => {
                      if (e.target !== e.currentTarget) return;
                      const s = slotFromY(d, e.clientY - e.currentTarget.getBoundingClientRect().top);
                      const hh = (n: number) => String(n).padStart(2, "0");
                      setDraft({ day: d, start: `${hh(s.getHours())}:${hh(s.getMinutes())}`, end: `${hh(s.getHours() + 1)}:${hh(s.getMinutes())}` });
                    }}
                  >
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => <span key={i} className="hour-line" style={{ top: i * HOUR_PX }} />)}
                    {dayEvents.map((e) => (
                      <div key={e.id} className="block block-event" style={{ top: top(e.start), height: height(e.start, e.end), ["--c" as string]: color(e.projectId) }}>
                        <span className="block-title">{e.title}</span>
                        <span className="block-time">{fmtTime(e.start)} – {fmtTime(e.end)}</span>
                        <button className="icon-btn icon-btn-xs block-del" onClick={() => deleteEvent(e.id)} aria-label="Delete event"><Trash2 size={11} /></button>
                      </div>
                    ))}
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`block block-task ${t.done ? "is-done" : ""}`}
                        style={{ top: top(t.scheduledStart!), height: height(t.scheduledStart!, t.scheduledEnd!), ["--c" as string]: color(t.projectId) }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/mova-task", t.id);
                          e.dataTransfer.setData("text/mova-offset", String(e.clientY - e.currentTarget.getBoundingClientRect().top));
                        }}
                        onClick={() => t.projectId && go({ name: "project", id: t.projectId, tab: "tasks" })}
                      >
                        <span className="block-title">{t.title}</span>
                        <span className="block-time">{fmtTime(t.scheduledStart!)} – {fmtTime(t.scheduledEnd!)}</span>
                      </div>
                    ))}
                    {isSameDay(d, now) && now.getHours() >= START_HOUR && now.getHours() < END_HOUR && (
                      <span className="now-marker" style={{ top: top(now.toISOString()) }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {draft && <EventModal draft={draft} onClose={() => setDraft(null)} onSave={addEvent} />}
    </div>
  );
}

function EventModal({ draft, onClose, onSave }: { draft: Draft; onClose: () => void; onSave: (e: { title: string; start: string; end: string; projectId?: string }) => void }) {
  const projects = useStore((s) => s.projects);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(`${draft.day.getFullYear()}-${pad(draft.day.getMonth() + 1)}-${pad(draft.day.getDate())}`);
  const [start, setStart] = useState(draft.start);
  const [end, setEnd] = useState(draft.end);
  const [projectId, setProjectId] = useState("");

  const save = () => {
    if (!title.trim()) return;
    const s = new Date(`${date}T${start}`);
    let e = new Date(`${date}T${end}`);
    if (e <= s) e = new Date(s.getTime() + 3_600_000);
    onSave({ title: title.trim(), start: s.toISOString(), end: e.toISOString(), projectId: projectId || undefined });
    onClose();
  };

  return (
    <Modal title="New event" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!title.trim()} onClick={save}>Add event</button></>}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Maths" /></Field>
        <div className="form-row">
          <Field label="Date"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Start"><input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="End"><input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
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
