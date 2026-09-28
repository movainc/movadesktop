import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CalendarDays, CheckSquare, Code2, FileText, Folder, Home, LayoutGrid, Plus, Search, Target } from "lucide-react";
import { useStore } from "../lib/store";
import { dueLabel, fmtDate, fmtTime } from "../lib/dates";
import { FileIcon, Kbd, ProjectDot } from "./ui";

type Item = { key: string; group: string; icon: ReactNode; title: string; sub?: string; run: () => void };

export function SearchPalette({ onNewProject }: { onNewProject: () => void }) {
  const s = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const close = () => s.setSearchOpen(false);
  const run = (fn: () => void) => () => { fn(); close(); };

  const items = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    const proj = (id?: string) => s.projects.find((p) => p.id === id);
    if (!query) {
      return [
        { key: "a-note", group: "Actions", icon: <Plus size={15} />, title: "New note", run: run(() => { const n = s.addNote(); s.go({ name: "notes", id: n.id }); }) },
        { key: "a-project", group: "Actions", icon: <Plus size={15} />, title: "New project", run: run(onNewProject) },
        { key: "a-focus", group: "Actions", icon: <Target size={15} />, title: "Start focus", run: run(() => s.startFocus({})) },
        { key: "g-today", group: "Go to", icon: <Home size={15} />, title: "Today", run: run(() => s.go({ name: "today" })) },
        { key: "g-tasks", group: "Go to", icon: <CheckSquare size={15} />, title: "Tasks", run: run(() => s.go({ name: "tasks" })) },
        { key: "g-projects", group: "Go to", icon: <LayoutGrid size={15} />, title: "Projects", run: run(() => s.go({ name: "projects" })) },
        { key: "g-calendar", group: "Go to", icon: <CalendarDays size={15} />, title: "Calendar", run: run(() => s.go({ name: "calendar" })) },
        { key: "g-notes", group: "Go to", icon: <FileText size={15} />, title: "Notes", run: run(() => s.go({ name: "notes" })) },
        { key: "g-files", group: "Go to", icon: <Folder size={15} />, title: "Files", run: run(() => s.go({ name: "files" })) },
        { key: "g-code", group: "Go to", icon: <Code2 size={15} />, title: "Code", run: run(() => s.go({ name: "code" })) },
      ];
    }
    const hit = (...xs: (string | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(query));
    const matchedProjectIds = new Set(s.projects.filter((p) => hit(p.name, p.area)).map((p) => p.id));
    const viaProject = (id?: string) => !!id && matchedProjectIds.has(id);
    return [
      ...s.projects.filter((p) => matchedProjectIds.has(p.id) || hit(p.description)).map((p) => ({
        key: p.id, group: "Projects", icon: <ProjectDot color={p.color} />, title: p.name, sub: p.area, run: run(() => s.go({ name: "project", id: p.id })),
      })),
      ...s.tasks.filter((t) => hit(t.title) || viaProject(t.projectId)).map((t) => ({
        key: t.id, group: "Tasks", icon: <CheckSquare size={15} />, title: t.title, sub: [proj(t.projectId)?.name, t.due && dueLabel(t.due), t.done && "Done"].filter(Boolean).join(" · "),
        run: run(() => (t.projectId ? s.go({ name: "project", id: t.projectId, tab: "tasks" }) : s.go({ name: "tasks" }))),
      })),
      ...s.notes.filter((n) => hit(n.title, n.body) || viaProject(n.projectId)).map((n) => ({
        key: n.id, group: "Notes", icon: <FileText size={15} />, title: n.title || "Untitled", sub: proj(n.projectId)?.name, run: run(() => s.go({ name: "notes", id: n.id })),
      })),
      ...s.files.filter((f) => hit(f.name) || viaProject(f.projectId)).map((f) => ({
        key: f.id, group: "Files", icon: <FileIcon name={f.name} size={15} />, title: f.name, sub: proj(f.projectId)?.name, run: run(() => { s.touch("file", f.id); s.go(typeof f.content === "string" ? { name: "code", fileId: f.id } : { name: "files", folderId: f.folderId }); }),
      })),
      ...s.events.filter((e) => hit(e.title) || viaProject(e.projectId)).map((e) => ({
        key: e.id, group: "Calendar", icon: <CalendarDays size={15} />, title: e.title, sub: `${fmtDate(e.start, { weekday: "short", day: "numeric", month: "short" })} · ${fmtTime(e.start)}`, run: run(() => s.go({ name: "calendar" })),
      })),
    ].slice(0, 40);
  }, [q, s.projects, s.tasks, s.notes, s.files, s.events]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); items[active]?.run(); }
    else if (e.key === "Escape") close();
  };

  let lastGroup = "";
  return (
    <div className="overlay overlay-top" onMouseDown={close}>
      <div className="palette" role="dialog" aria-label="Search" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Search size={17} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search projects, tasks, notes, files…" />
          <Kbd>esc</Kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {items.length === 0 && <p className="palette-empty">No results for “{q}”</p>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? <p className="palette-group">{it.group}</p> : null;
            lastGroup = it.group;
            return (
              <div key={it.key}>
                {header}
                <button className={`palette-item ${i === active ? "is-active" : ""}`} onMouseMove={() => setActive(i)} onClick={it.run}>
                  <span className="palette-icon">{it.icon}</span>
                  <span className="palette-title">{it.title}</span>
                  {it.sub && <span className="palette-sub">{it.sub}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <footer className="palette-foot">
          <span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span><Kbd>↵</Kbd> open</span>
        </footer>
      </div>
    </div>
  );
}
