import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { useStore, type State } from "../lib/store";
import { useSession } from "../lib/session";
import type { View } from "../lib/types";
import { LogoMark } from "./Logo";
import { Kbd, modKey } from "./ui";

type Counts = ReturnType<typeof count>;
type Step = {
  title: string;
  body: string;
  doing?: string;
  target?: string;
  view?: (s: State) => View | null;
  done?: (s: State, base: Counts) => boolean;
};

const count = (s: State) => ({
  projects: s.projects.length,
  tasks: s.tasks.length,
  scheduled: s.tasks.filter((t) => t.scheduledStart).length,
  writtenNotes: s.notes.filter((n) => n.body.trim().length > 2).length,
  noteTasks: s.tasks.filter((t) => t.noteId).length,
  files: s.files.length,
  textFiles: s.files.filter((f) => typeof f.content === "string").length,
});

const latestProject = (s: State) => s.projects[s.projects.length - 1];

const STEPS: Step[] = [
  {
    title: "Welcome to mova",
    body: "mova keeps everything for a project together: tasks, notes, files, time and code. This quick tour has you set up your first project as you go. It takes about two minutes.",
  },
  {
    title: "Create your first project",
    body: "Projects are the centre of mova. Make one for something you're working on right now: a school subject, an assignment, a side project.",
    doing: "Click New project, give it a name and pick an icon",
    target: ".page .page-actions .btn-primary",
    view: () => ({ name: "projects" }),
    done: (s, b) => s.projects.length > b.projects,
  },
  {
    title: "Add a task",
    body: "This is your project's home. Everything you add here stays connected to it. Type the first thing you need to do and press Enter.",
    doing: "Add a task in the Tasks box",
    target: ".page .quick-add",
    view: (s) => (latestProject(s) ? { name: "project", id: latestProject(s)!.id, tab: "overview" } : { name: "tasks" }),
    done: (s, b) => s.tasks.length > b.tasks,
  },
  {
    title: "Give it a time",
    body: "A task becomes real when it has time. Drag your task from the Unscheduled list onto a slot in the week.",
    doing: "Drag a task onto the calendar",
    target: ".subnav-wide .drag-list",
    view: () => ({ name: "calendar" }),
    done: (s, b) => s.tasks.filter((t) => t.scheduledStart).length > b.scheduled,
  },
  {
    title: "Write a note",
    body: "Notes are deliberately simple. Create one and jot down a few ideas, one per line.",
    doing: "Press + and write a couple of lines",
    target: ".notes-list-head .icon-btn",
    view: () => ({ name: "notes" }),
    done: (s, b) => s.notes.filter((n) => n.body.trim().length > 2).length > b.writtenNotes,
  },
  {
    title: "Turn an idea into a task",
    body: "Select a line in your note. A Turn into task button appears at the top, and the new task remembers which note it came from.",
    doing: "Select text, then press Turn into task",
    target: ".editor-body",
    done: (s, b) => s.tasks.filter((t) => t.noteId).length > b.noteTasks,
  },
  {
    title: "Add a file",
    body: "Keep documents, images and PDFs with your work. Upload a file or drag one onto this page. On desktop you can also open files that live in Google Drive.",
    doing: "Upload or drop any file",
    target: ".page-files .page-actions .btn-primary",
    view: () => ({ name: "files" }),
    done: (s, b) => s.files.length > b.files,
  },
  {
    title: "Write some code",
    body: "mova has a full code editor built on Monaco, the open-source core of VS Code. Create a file, for example main.py, and start typing. It saves automatically.",
    doing: "Create a new file in the Explorer",
    target: ".code-explorer-head .icon-btn",
    view: () => ({ name: "code" }),
    done: (s, b) => s.files.filter((f) => typeof f.content === "string").length > b.textFiles,
  },
  {
    title: "Find anything",
    body: `Search looks across projects, tasks, notes, files and events at once. Open it from the sidebar, or press ${modKey} K anywhere.`,
    doing: "Open search",
    target: ".search-trigger",
    done: (s) => s.searchOpen,
  },
  {
    title: "Focus",
    body: "When it's time to work, Focus hides everything except one task and a timer. Press Esc to come back.",
    doing: "Press Focus",
    target: ".page-today .page-actions .btn-primary",
    view: () => ({ name: "today" }),
    done: (s) => !!s.focus,
  },
  {
    title: "You're all set",
    body: "That's mova: projects that hold everything, a clear Today, time on the calendar, notes, files, code and focus. You can replay this tour any time from Settings.",
  },
];

function useTargetRect(selector?: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) { setRect(null); return; }
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(selector);
      const r = el?.getBoundingClientRect() ?? null;
      setRect((prev) => (prev && r && prev.x === r.x && prev.y === r.y && prev.width === r.width && prev.height === r.height ? prev : r));
      raf = window.setTimeout(tick, 250) as unknown as number;
    };
    tick();
    return () => clearTimeout(raf);
  }, [selector]);
  return rect;
}

export function Tour() {
  const step = useStore((s) => s.tourStep)!;
  const state = useStore();
  const { setTourStep, finishTour, go } = state;
  const firstName = useSession((s) => s.account?.name.split(" ")[0]);
  const def = STEPS[step];
  const base = useRef<Counts>(count(useStore.getState()));
  const [done, setDone] = useState(false);
  const rect = useTargetRect(def.target);

  useEffect(() => {
    base.current = count(useStore.getState());
    setDone(false);
    const v = def.view?.(useStore.getState());
    if (v) go(v);
    if (step > 0 && step < STEPS.length - 1) {
      const s = useStore.getState();
      if (s.searchOpen) s.setSearchOpen(false);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = useMemo(() => !!def.done?.(state, base.current), [state, def]);
  useEffect(() => {
    if (!isDone || done) return;
    setDone(true);
    const t = setTimeout(() => {
      const s = useStore.getState();
      if (s.focus && step === STEPS.length - 2) s.endFocus();
      if (s.searchOpen) s.setSearchOpen(false);
      setTourStep(step + 1);
    }, 1100);
    return () => clearTimeout(t);
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => (step >= STEPS.length - 1 ? finishTour() : setTourStep(step + 1));
  const interactive = !!def.done;
  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <>
      {rect && !done && (
        <div className="tour-ring" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} aria-hidden />
      )}
      <aside className={`tour ${interactive ? "" : "tour-center"}`} role="dialog" aria-label="mova tour">
        <header className="tour-head">
          {interactive ? <span className="tour-count">Step {step} of {STEPS.length - 2}</span> : <LogoMark size={22} />}
          <button className="icon-btn icon-btn-xs" onClick={finishTour} aria-label="End tour"><X size={14} /></button>
        </header>
        {interactive && <div className="progress tour-progress"><span style={{ width: `${pct}%`, background: "var(--accent)" }} /></div>}
        <h3 className="tour-title">{step === 0 && firstName ? `Welcome to mova, ${firstName}` : def.title}</h3>
        <p className="tour-body">{def.body}</p>
        {def.doing && (
          <div className={`tour-doing ${done ? "is-done" : ""}`}>
            <span className="tour-check">{done ? <Check size={12} strokeWidth={3} /> : <span className="tour-pulse" />}</span>
            {done ? "Nice — done" : def.doing}
          </div>
        )}
        {step === STEPS.length - 1 && (
          <dl className="tour-keys">
            <dt>Search</dt><dd><Kbd>{modKey}</Kbd><Kbd>K</Kbd></dd>
            <dt>Focus</dt><dd><Kbd>{modKey}</Kbd><Kbd>⇧</Kbd><Kbd>F</Kbd></dd>
            <dt>Jump to a screen</dt><dd><Kbd>{modKey}</Kbd><Kbd>1</Kbd>–<Kbd>7</Kbd></dd>
          </dl>
        )}
        <footer className="tour-foot">
          {step > 0 && step < STEPS.length - 1 ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setTourStep(step - 1)}><ArrowLeft size={13} /> Back</button>
          ) : step === 0 ? (
            <button className="btn btn-ghost btn-sm" onClick={finishTour}>Skip tour</button>
          ) : <span />}
          <button className={`btn btn-sm ${!interactive || done ? "btn-primary" : ""}`} onClick={next}>
            {step === 0 ? "Start the tour" : step === STEPS.length - 1 ? "Start using mova" : done ? "Next" : "Skip this step"}
          </button>
        </footer>
      </aside>
    </>
  );
}
