import { CalendarDays, Code2, CheckSquare, Clock, FileText, Folder, Home, LayoutGrid, PanelLeft, Plus, Search, Settings, Share2, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "../lib/store";
import { daysFromToday } from "../lib/dates";
import type { View } from "../lib/types";
import { LogoMark } from "./Logo";
import { Kbd, ProjectDot, modKey } from "./ui";

function NavItem({ icon, label, active, onClick, count, collapsed }: { icon: ReactNode; label: string; active: boolean; onClick: () => void; count?: number; collapsed: boolean }) {
  return (
    <button className={`nav-item ${active ? "is-active" : ""}`} onClick={onClick} title={collapsed ? label : undefined}>
      <span className="nav-icon">{icon}</span>
      {!collapsed && <span className="nav-label">{label}</span>}
      {!collapsed && count ? <span className="nav-count">{count}</span> : null}
    </button>
  );
}

export function Sidebar({ onNewProject }: { onNewProject: () => void }) {
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const aiEnabled = useStore((s) => s.aiEnabled);
  const assistantOpen = useStore((s) => s.assistantOpen);
  const setAssistantOpen = useStore((s) => s.setAssistantOpen);

  const todayCount = tasks.filter((t) => !t.done && ((t.due && daysFromToday(t.due) <= 0) || (t.scheduledStart && daysFromToday(t.scheduledStart) === 0))).length;
  const starred = projects.filter((p) => p.starred);
  const is = (name: View["name"]) => view.name === name;
  const isFiles = (filter?: string) => view.name === "files" && view.filter === filter;
  const iconSize = 16;

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-top" data-tauri-drag-region>
        {!collapsed && (
          <button className="brand" onClick={() => go({ name: "today" })}>
            <LogoMark size={24} />
            <span>mova</span>
          </button>
        )}
        <button className="icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <PanelLeft size={16} />
        </button>
      </div>

      <button className="search-trigger" onClick={() => setSearchOpen(true)} title={collapsed ? "Search" : undefined}>
        <Search size={15} />
        {!collapsed && (
          <>
            <span>Search</span>
            <span className="search-trigger-keys"><Kbd>{modKey}</Kbd><Kbd>K</Kbd></span>
          </>
        )}
      </button>

      <nav className="nav">
        <NavItem collapsed={collapsed} icon={<Home size={iconSize} />} label="Today" active={is("today")} onClick={() => go({ name: "today" })} count={todayCount} />
        <NavItem collapsed={collapsed} icon={<CheckSquare size={iconSize} />} label="Tasks" active={is("tasks")} onClick={() => go({ name: "tasks" })} />
        <NavItem collapsed={collapsed} icon={<LayoutGrid size={iconSize} />} label="Projects" active={is("projects") || is("project")} onClick={() => go({ name: "projects" })} />
        <NavItem collapsed={collapsed} icon={<CalendarDays size={iconSize} />} label="Calendar" active={is("calendar")} onClick={() => go({ name: "calendar" })} />
        <NavItem collapsed={collapsed} icon={<FileText size={iconSize} />} label="Notes" active={is("notes")} onClick={() => go({ name: "notes" })} />
        <NavItem collapsed={collapsed} icon={<Folder size={iconSize} />} label="Files" active={view.name === "files" && !view.filter && view.folderId !== "f-shared"} onClick={() => go({ name: "files" })} />
        <NavItem collapsed={collapsed} icon={<Code2 size={iconSize} />} label="Code" active={is("code")} onClick={() => go({ name: "code" })} />
      </nav>

      <div className="nav-divider" />

      <nav className="nav">
        <NavItem collapsed={collapsed} icon={<Star size={iconSize} />} label="Starred" active={isFiles("starred")} onClick={() => go({ name: "files", filter: "starred" })} />
        <NavItem collapsed={collapsed} icon={<Clock size={iconSize} />} label="Recent" active={isFiles("recent")} onClick={() => go({ name: "files", filter: "recent" })} />
        <NavItem collapsed={collapsed} icon={<Share2 size={iconSize} />} label="Shared" active={view.name === "files" && view.folderId === "f-shared"} onClick={() => go({ name: "files", folderId: "f-shared" })} />
      </nav>

      {!collapsed && (
        <div className="sidebar-projects">
          <div className="sidebar-heading">
            <span>Projects</span>
            <button className="icon-btn icon-btn-xs" onClick={onNewProject} aria-label="New project">
              <Plus size={13} />
            </button>
          </div>
          {(starred.length ? starred : projects.slice(0, 5)).map((p) => (
            <button key={p.id} className={`nav-item nav-project ${view.name === "project" && view.id === p.id ? "is-active" : ""}`} onClick={() => go({ name: "project", id: p.id })}>
              <span className="nav-icon"><ProjectDot color={p.color} /></span>
              <span className="nav-label">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-bottom">
        {aiEnabled && (
          <NavItem collapsed={collapsed} icon={<Sparkles size={iconSize} />} label="Assistant" active={assistantOpen} onClick={() => setAssistantOpen(!assistantOpen)} />
        )}
        <NavItem collapsed={collapsed} icon={<Settings size={iconSize} />} label="Settings" active={is("settings")} onClick={() => go({ name: "settings" })} />
      </div>
    </aside>
  );
}
