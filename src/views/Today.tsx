import { ArrowRight, FileText, GraduationCap, LayoutGrid, Play, Plus, Target } from "lucide-react";
import { useStore } from "../lib/store";
import { daysFromToday, dueLabel, fmtDate, fmtTime, greeting, isSameDay, relativeAgo } from "../lib/dates";
import { Empty, FileIcon, ProjectDot, QuickAddTask, Section, TaskRow } from "../components/ui";

type Slot = { id: string; start: string; end: string; title: string; projectId?: string; kind: "event" | "task"; done?: boolean };

export function Today() {
  const { tasks, events, projects, recent, notes, files, go, startFocus, startTour } = useStore();
  const now = new Date();

  const slots: Slot[] = [
    ...events.filter((e) => isSameDay(new Date(e.start), now)).map((e) => ({ ...e, kind: "event" as const })),
    ...tasks
      .filter((t) => t.scheduledStart && t.scheduledEnd && isSameDay(new Date(t.scheduledStart), now))
      .map((t) => ({ id: t.id, title: t.title, start: t.scheduledStart!, end: t.scheduledEnd!, projectId: t.projectId, kind: "task" as const, done: t.done })),
  ].sort((a, b) => a.start.localeCompare(b.start));
  const nowIndex = slots.findIndex((s) => new Date(s.end) > now);

  const todayTasks = tasks
    .filter((t) => !t.done && ((t.due && daysFromToday(t.due) <= 0) || (!t.due && !t.projectId)))
    .sort((a, b) => (a.due ?? "z").localeCompare(b.due ?? "z"));
  const doneToday = tasks.filter((t) => t.done && t.completedAt && isSameDay(new Date(t.completedAt), now)).length;

  const dueSoon = [
    ...projects.filter((p) => p.deadline && daysFromToday(p.deadline) >= 0 && daysFromToday(p.deadline) <= 7).map((p) => ({ id: p.id, title: p.name, due: p.deadline!, color: p.color, projectId: p.id, isProject: true })),
    ...tasks
      .filter((t) => !t.done && t.due && daysFromToday(t.due) >= 1 && daysFromToday(t.due) <= 7)
      .map((t) => ({ id: t.id, title: t.title, due: t.due!, color: projects.find((p) => p.id === t.projectId)?.color ?? "var(--faint)", projectId: t.projectId, isProject: false })),
  ].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 7);

  const nextTask =
    tasks.find((t) => !t.done && t.scheduledStart && new Date(t.scheduledEnd ?? t.scheduledStart) > now && isSameDay(new Date(t.scheduledStart), now)) ??
    todayTasks.find((t) => t.projectId);
  const nextProject = projects.find((p) => p.id === nextTask?.projectId);
  const nextRemaining = nextTask?.projectId ? tasks.filter((t) => t.projectId === nextTask.projectId && !t.done).length : 0;

  const recentItems = recent
    .map((r) => {
      if (r.kind === "project") {
        const p = projects.find((x) => x.id === r.id);
        return p && { key: `p${p.id}`, icon: <span className="recent-icon"><LayoutGrid size={14} /></span>, title: p.name, sub: p.area, at: r.at, open: () => go({ name: "project", id: p.id }) };
      }
      if (r.kind === "note") {
        const n = notes.find((x) => x.id === r.id);
        return n && { key: `n${n.id}`, icon: <span className="recent-icon"><FileText size={14} /></span>, title: n.title || "Untitled", sub: "Note", at: r.at, open: () => go({ name: "notes", id: n.id }) };
      }
      const f = files.find((x) => x.id === r.id);
      return f && { key: `f${f.id}`, icon: <FileIcon name={f.name} size={14} />, title: f.name, sub: "File", at: r.at, open: () => go({ name: "files", folderId: f.folderId }) };
    })
    .filter(Boolean)
    .slice(0, 5);

  const summary = [
    `${slots.filter((s) => s.kind === "event").length} events`,
    `${todayTasks.length} tasks today`,
    doneToday ? `${doneToday} done` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="page page-today">
      <header className="page-header">
        <div>
          <p className="eyebrow">{fmtDate(now.toISOString(), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>{greeting(now)}</h1>
          <p className="page-sub">{summary}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => startFocus({ projectId: nextTask?.projectId, taskId: nextTask?.id })}>
            <Target size={15} /> Focus
          </button>
        </div>
      </header>

      {projects.length === 0 && (
        <div className="welcome-card">
          <div>
            <p className="eyebrow">Getting started</p>
            <h2>Your workspace is ready</h2>
            <p>Start with a project — a subject, an assignment or something you're building. Everything else hangs off it.</p>
          </div>
          <div className="welcome-actions">
            <button className="btn btn-primary" onClick={() => go({ name: "projects" })}><Plus size={15} /> Create a project</button>
            <button className="btn" onClick={startTour}><GraduationCap size={15} /> Take the 2-minute tour</button>
          </div>
        </div>
      )}

      <div className="today-grid">
        <div className="col">
          <Section title="Today" action={<button className="link-btn" onClick={() => go({ name: "calendar" })}>Calendar <ArrowRight size={13} /></button>}>
            {slots.length === 0 ? (
              <Empty title="Nothing scheduled" hint="Drag a task onto the calendar to give it time." />
            ) : (
              <ol className="schedule">
                {slots.map((s, i) => {
                  const project = projects.find((p) => p.id === s.projectId);
                  const isPast = new Date(s.end) <= now;
                  const isNow = new Date(s.start) <= now && new Date(s.end) > now;
                  return (
                    <li key={s.id}>
                      {i === nowIndex && !isNow && <div className="now-line"><span>{fmtTime(now.toISOString())}</span></div>}
                      <div className={`slot ${isPast ? "is-past" : ""} ${isNow ? "is-now" : ""} ${s.kind === "task" ? "is-task" : ""}`}
                        onClick={() => (s.projectId ? go({ name: "project", id: s.projectId }) : go({ name: "calendar" }))}>
                        <time className="slot-time">{fmtTime(s.start)}</time>
                        <span className="slot-rail" style={{ background: project?.color ?? "var(--border-strong)" }} />
                        <div className="slot-body">
                          <span className={`slot-title ${s.done ? "is-done" : ""}`}>{s.title}</span>
                          <span className="slot-sub">
                            {fmtTime(s.start)} – {fmtTime(s.end)}
                            {project && <> · {project.area === "School" ? project.area : project.name}</>}
                            {isNow && <span className="live-badge">Now</span>}
                          </span>
                        </div>
                        {s.kind === "task" && (
                          <button className="icon-btn slot-action" aria-label="Focus on this" onClick={(e) => { e.stopPropagation(); startFocus({ projectId: s.projectId, taskId: s.id }); }}>
                            <Play size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {nowIndex === -1 && <li><div className="now-line"><span>{fmtTime(now.toISOString())}</span></div></li>}
              </ol>
            )}
          </Section>

          <Section title="Tasks" action={<button className="link-btn" onClick={() => go({ name: "tasks" })}>All tasks <ArrowRight size={13} /></button>}>
            <div className="task-list">
              {todayTasks.map((t) => <TaskRow key={t.id} task={t} onOpen={(task) => task.projectId && go({ name: "project", id: task.projectId, tab: "tasks" })} />)}
              <QuickAddTask due={new Date().toISOString()} placeholder="Add a task for today" />
            </div>
            {todayTasks.length === 0 && <p className="quiet">Clear for today.</p>}
          </Section>
        </div>

        <div className="col col-side">
          <div className="focus-card">
            <p className="eyebrow">Focus</p>
            {nextTask ? (
              <>
                <p className="focus-card-title">{nextTask.title}</p>
                <p className="focus-card-sub">
                  {nextProject && <><ProjectDot color={nextProject.color} /> {nextProject.name} · </>}
                  {nextTask.scheduledStart ? `${fmtTime(nextTask.scheduledStart)} – ${fmtTime(nextTask.scheduledEnd!)}` : nextTask.due ? `Due ${dueLabel(nextTask.due).toLowerCase()}` : ""}
                </p>
                <div className="focus-card-foot">
                  <span className="quiet">{nextRemaining} tasks remaining</span>
                  <button className="btn btn-primary btn-sm" onClick={() => startFocus({ projectId: nextTask.projectId, taskId: nextTask.id })}>
                    <Play size={13} /> Start
                  </button>
                </div>
              </>
            ) : (
              <p className="focus-card-sub">Nothing urgent. Pick a project and get into it.</p>
            )}
          </div>

          <Section title="Due soon">
            {dueSoon.length === 0 ? <p className="quiet">Nothing due this week.</p> : (
              <ul className="due-list">
                {dueSoon.map((d) => (
                  <li key={d.id} onClick={() => d.projectId && go({ name: "project", id: d.projectId })}>
                    <ProjectDot color={d.color} />
                    <span className={`due-title ${d.isProject ? "is-strong" : ""}`}>{d.title}</span>
                    <span className="due-when">{dueLabel(d.due)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Recent">
            {recentItems.length === 0 && <p className="quiet">Projects, notes and files you open will show up here.</p>}
            <ul className="recent-list">
              {recentItems.map((r) => r && (
                <li key={r.key} onClick={r.open}>
                  {r.icon}
                  <span className="recent-title">{r.title}</span>
                  <span className="recent-sub">{relativeAgo(r.at)}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
