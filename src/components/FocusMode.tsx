import { useEffect, useState } from "react";
import { Check, Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { useStore } from "../lib/store";
import { dueLabel } from "../lib/dates";
import { LogoMark } from "./Logo";
import { Kbd } from "./ui";

const PRESETS = [25, 50, 90];

export function FocusMode() {
  const focus = useStore((s) => s.focus)!;
  const { tasks, projects, endFocus, toggleTask, startFocus } = useStore();
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  const project = projects.find((p) => p.id === focus.projectId);
  const pool = tasks.filter((t) => !t.done && (!focus.projectId || t.projectId === focus.projectId));
  const task = tasks.find((t) => t.id === focus.taskId) ?? pool[0];
  const remaining = pool.filter((t) => t.id !== task?.id).length;
  const due = project?.deadline ?? task?.due;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (setRunning(false), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endFocus();
      if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); setRunning((r) => !r); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [endFocus]);

  const next = () => {
    const n = pool.find((t) => t.id !== task?.id);
    startFocus({ projectId: focus.projectId, taskId: n?.id });
  };
  const complete = () => {
    if (!task) return;
    toggleTask(task.id);
    next();
  };
  const setPreset = (m: number) => { setMinutes(m); setLeft(m * 60); setRunning(false); };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const progress = 1 - left / (minutes * 60);

  return (
    <div className="focus" role="dialog" aria-label="Focus mode">
      <header className="focus-top">
        <span className="focus-brand"><LogoMark size={20} /> focus</span>
        <button className="icon-btn" onClick={endFocus} aria-label="Exit focus"><X size={18} /></button>
      </header>

      <main className="focus-main">
        <p className="focus-project">{project?.name ?? "Focus"}</p>
        <h1 className="focus-task">{task?.title ?? "Nothing left to do here."}</h1>

        <div className="focus-rule" />

        <div className="focus-timer">
          <svg viewBox="0 0 120 120" className="focus-ring" aria-hidden>
            <circle cx="60" cy="60" r="54" className="focus-ring-track" />
            <circle cx="60" cy="60" r="54" className="focus-ring-fill" strokeDasharray={339.3} strokeDashoffset={339.3 * (1 - progress)} />
          </svg>
          <span className="focus-time">{mm}:{ss}</span>
        </div>

        <div className="focus-controls">
          <button className="icon-btn focus-ctl" onClick={() => setPreset(minutes)} aria-label="Reset"><RotateCcw size={16} /></button>
          <button className="btn btn-primary focus-start" onClick={() => setRunning(!running)}>
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {left === minutes * 60 ? "Start" : "Resume"}</>}
          </button>
          <button className="icon-btn focus-ctl" onClick={next} aria-label="Skip to next task" disabled={remaining === 0}><SkipForward size={16} /></button>
        </div>

        <div className="focus-presets">
          {PRESETS.map((m) => <button key={m} className={`chip ${m === minutes ? "is-active" : ""}`} onClick={() => setPreset(m)}>{m} min</button>)}
        </div>

        <div className="focus-rule" />

        <p className="focus-meta">
          {remaining} {remaining === 1 ? "task" : "tasks"} remaining{due && <> · Due {dueLabel(due).toLowerCase()}</>}
        </p>
        {task && <button className="btn btn-ghost focus-done" onClick={complete}><Check size={15} /> Mark done</button>}
      </main>

      <footer className="focus-foot"><Kbd>space</Kbd> start / pause <Kbd>esc</Kbd> exit</footer>
    </div>
  );
}
