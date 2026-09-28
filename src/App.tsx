import { Suspense, lazy, useEffect, useState } from "react";
import { useStore } from "./lib/store";
import type { View } from "./lib/types";
import { Sidebar } from "./components/Sidebar";
import { SearchPalette } from "./components/SearchPalette";
import { FocusMode } from "./components/FocusMode";
import { Assistant } from "./components/Assistant";
import { Today } from "./views/Today";
import { Tasks } from "./views/Tasks";
import { NewProjectModal, Projects } from "./views/Projects";
import { ProjectDetail } from "./views/ProjectDetail";
import { Calendar } from "./views/Calendar";
import { Notes } from "./views/Notes";
import { Files } from "./views/Files";
import { Settings } from "./views/Settings";

const Code = lazy(() => import("./views/Code"));

const SHORTCUT_VIEWS: Record<string, View> = {
  "1": { name: "today" },
  "2": { name: "tasks" },
  "3": { name: "projects" },
  "4": { name: "calendar" },
  "5": { name: "notes" },
  "6": { name: "files" },
  "7": { name: "code" },
};

export default function App() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const searchOpen = useStore((s) => s.searchOpen);
  const focus = useStore((s) => s.focus);
  const assistantOpen = useStore((s) => s.assistantOpen && s.aiEnabled);
  const [newProject, setNewProject] = useState(false);

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const s = useStore.getState();
      const key = e.key.toLowerCase();
      if (key === "k") { e.preventDefault(); s.setSearchOpen(!s.searchOpen); }
      else if (key === "j" && s.aiEnabled) { e.preventDefault(); s.setAssistantOpen(!s.assistantOpen); }
      else if (key === "\\") { e.preventDefault(); s.toggleSidebar(); }
      else if (key === "f" && e.shiftKey) { e.preventDefault(); s.focus ? s.endFocus() : s.startFocus(s.view.name === "project" ? { projectId: s.view.id } : {}); }
      else if (key === "[") { e.preventDefault(); s.back(); }
      else if (SHORTCUT_VIEWS[e.key]) { e.preventDefault(); s.go(SHORTCUT_VIEWS[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  let content;
  switch (view.name) {
    case "today": content = <Today />; break;
    case "tasks": content = <Tasks />; break;
    case "projects": content = <Projects onNewProject={() => setNewProject(true)} />; break;
    case "project": content = <ProjectDetail key={view.id} id={view.id} tab={view.tab} />; break;
    case "calendar": content = <Calendar />; break;
    case "notes": content = <Notes />; break;
    case "files": content = <Files />; break;
    case "code": content = <Suspense fallback={<div className="page" />}><Code /></Suspense>; break;
    case "settings": content = <Settings />; break;
  }

  return (
    <div className={`app ${assistantOpen ? "has-assistant" : ""}`}>
      <Sidebar onNewProject={() => setNewProject(true)} />
      <main className="main">{content}</main>
      {assistantOpen && <Assistant />}
      {searchOpen && <SearchPalette onNewProject={() => setNewProject(true)} />}
      {newProject && <NewProjectModal onClose={() => setNewProject(false)} />}
      {focus && <FocusMode />}
    </div>
  );
}
