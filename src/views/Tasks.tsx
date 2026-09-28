import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "../lib/store";
import { daysFromToday, dueLabel } from "../lib/dates";
import type { Task } from "../lib/types";
import { Empty, ProjectDot, QuickAddTask, TaskRow } from "../components/ui";
import { TaskPanel } from "../components/TaskPanel";

type Filter = "all" | "today" | "upcoming" | "inbox" | "done";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
  { id: "inbox", label: "No project" },
  { id: "done", label: "Completed" },
];

const isToday = (t: Task) => (t.due && daysFromToday(t.due) <= 0) || (t.scheduledStart && daysFromToday(t.scheduledStart) === 0);

export function Tasks() {
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const filter: Filter = (view.name === "tasks" && view.filter) || "all";
  const [openId, setOpenId] = useState<string | null>(null);

  const open = tasks.filter((t) => !t.done);
  const counts: Record<Filter, number> = {
    today: open.filter(isToday).length,
    upcoming: open.filter((t) => t.due && daysFromToday(t.due) > 0).length,
    all: open.length,
    inbox: open.filter((t) => !t.projectId).length,
    done: tasks.filter((t) => t.done).length,
  };

  let groups: { key: string; label: string; color?: string; items: Task[] }[] = [];
  if (filter === "all") {
    groups = [
      ...projects.map((p) => ({ key: p.id, label: p.name, color: p.color, items: open.filter((t) => t.projectId === p.id) })),
      { key: "none", label: "No project", items: open.filter((t) => !t.projectId) },
    ];
  } else if (filter === "upcoming") {
    const upcoming = open.filter((t) => t.due && daysFromToday(t.due) > 0).sort((a, b) => a.due!.localeCompare(b.due!));
    const byDay = new Map<string, Task[]>();
    upcoming.forEach((t) => byDay.set(dueLabel(t.due!), [...(byDay.get(dueLabel(t.due!)) ?? []), t]));
    groups = [...byDay].map(([label, items]) => ({ key: label, label, items }));
  } else if (filter === "today") {
    groups = [{ key: "today", label: "", items: open.filter(isToday).sort((a, b) => (a.scheduledStart ?? a.due ?? "").localeCompare(b.scheduledStart ?? b.due ?? "")) }];
  } else if (filter === "inbox") {
    groups = [{ key: "inbox", label: "", items: open.filter((t) => !t.projectId) }];
  } else {
    groups = [{ key: "done", label: "", items: tasks.filter((t) => t.done).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")) }];
  }
  groups = groups.filter((g) => g.items.length);

  return (
    <div className="split">
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Tasks</h1>
            <p className="page-sub">{counts.all} open · {counts.today} today</p>
          </div>
        </header>

        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f.id} className={`tab ${filter === f.id ? "is-active" : ""}`} onClick={() => go({ name: "tasks", filter: f.id })}>
              {f.label}
              <span className="tab-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {filter !== "done" && (
          <div className="task-list">
            <QuickAddTask key={filter} due={filter === "today" ? new Date().toISOString() : undefined} autoFocus={false} />
          </div>
        )}

        {groups.length === 0 ? (
          <Empty icon={<CheckCircle2 size={22} />} title={filter === "done" ? "Nothing completed yet" : "All clear"} hint={filter === "done" ? undefined : "Nothing here. Enjoy it."} />
        ) : (
          groups.map((g) => (
            <div key={g.key} className="task-group">
              {g.label && (
                <h3 className="group-title">
                  {g.color && <ProjectDot color={g.color} />}
                  {g.label}
                  <span className="group-count">{g.items.length}</span>
                </h3>
              )}
              <div className="task-list">
                {g.items.map((t) => (
                  <TaskRow key={t.id} task={t} showProject={filter !== "all"} onOpen={(task) => setOpenId(task.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {openId && <TaskPanel taskId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
