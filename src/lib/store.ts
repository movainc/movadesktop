import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed, PROJECT_COLORS } from "./seed";
import type { CalendarEvent, FileItem, Folder, ID, LinkItem, Note, Project, Task, Theme, View } from "./types";

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

type RecentKind = "project" | "note" | "file";
interface Recent { kind: RecentKind; id: ID; at: string }

interface Data {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  events: CalendarEvent[];
  folders: Folder[];
  files: FileItem[];
  links: LinkItem[];
}

interface State extends Data {
  view: View;
  history: View[];
  recent: Recent[];
  theme: Theme;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  assistantOpen: boolean;
  aiEnabled: boolean;
  focus: { projectId?: ID; taskId?: ID } | null;

  go: (v: View) => void;
  back: () => void;
  touch: (kind: RecentKind, id: ID) => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setAssistantOpen: (open: boolean) => void;
  setAiEnabled: (on: boolean) => void;
  startFocus: (f: { projectId?: ID; taskId?: ID }) => void;
  endFocus: () => void;

  addTask: (t: Partial<Task> & { title: string }) => Task;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  toggleTask: (id: ID) => void;
  deleteTask: (id: ID) => void;

  addProject: (p: Partial<Project> & { name: string }) => Project;
  updateProject: (id: ID, patch: Partial<Project>) => void;
  deleteProject: (id: ID) => void;

  addNote: (n?: Partial<Note>) => Note;
  updateNote: (id: ID, patch: Partial<Note>) => void;
  deleteNote: (id: ID) => void;

  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: ID) => void;

  addFolder: (name: string, parentId: ID) => void;
  addFiles: (files: Omit<FileItem, "id" | "starred" | "updatedAt">[]) => void;
  updateFile: (id: ID, patch: Partial<FileItem>) => void;
  deleteFile: (id: ID) => void;

  addLink: (l: Omit<LinkItem, "id">) => void;
  deleteLink: (id: ID) => void;

  resetWorkspace: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      view: { name: "today" },
      history: [],
      recent: [
        { kind: "project", id: "p-history", at: now() },
        { kind: "project", id: "p-robotics", at: now() },
        { kind: "project", id: "p-content", at: now() },
        { kind: "file", id: "fi3", at: now() },
      ],
      theme: "system",
      sidebarCollapsed: false,
      searchOpen: false,
      assistantOpen: false,
      aiEnabled: true,
      focus: null,

      go: (v) => {
        const cur = get().view;
        if (JSON.stringify(cur) === JSON.stringify(v)) return;
        set((s) => ({ view: v, history: [...s.history.slice(-30), cur] }));
        if (v.name === "project") get().touch("project", v.id);
      },
      back: () => set((s) => (s.history.length ? { view: s.history[s.history.length - 1], history: s.history.slice(0, -1) } : s)),
      touch: (kind, id) =>
        set((s) => ({ recent: [{ kind, id, at: now() }, ...s.recent.filter((r) => !(r.kind === kind && r.id === id))].slice(0, 12) })),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
      setAiEnabled: (aiEnabled) => set({ aiEnabled, assistantOpen: aiEnabled && get().assistantOpen }),
      startFocus: (focus) => set({ focus, searchOpen: false }),
      endFocus: () => set({ focus: null }),

      addTask: (t) => {
        const task: Task = { id: uid("t"), done: false, createdAt: now(), ...t };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? now() : undefined } : t)),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addProject: (p) => {
        const project: Project = {
          id: uid("p"),
          description: "",
          area: "Personal",
          color: PROJECT_COLORS[get().projects.length % PROJECT_COLORS.length],
          starred: false,
          createdAt: now(),
          ...p,
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },
      updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
          notes: s.notes.map((n) => (n.projectId === id ? { ...n, projectId: undefined } : n)),
          files: s.files.map((f) => (f.projectId === id ? { ...f, projectId: undefined } : f)),
          events: s.events.map((e) => (e.projectId === id ? { ...e, projectId: undefined } : e)),
          links: s.links.filter((l) => l.projectId !== id),
          recent: s.recent.filter((r) => !(r.kind === "project" && r.id === id)),
          view: { name: "projects" },
        })),

      addNote: (n = {}) => {
        const note: Note = { id: uid("n"), title: "", body: "", updatedAt: now(), ...n };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)) })),
      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          tasks: s.tasks.map((t) => (t.noteId === id ? { ...t, noteId: undefined } : t)),
        })),

      addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid("e") }] })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addFolder: (name, parentId) => set((s) => ({ folders: [...s.folders, { id: uid("f"), name, parentId }] })),
      addFiles: (files) =>
        set((s) => ({ files: [...s.files, ...files.map((f) => ({ ...f, id: uid("fi"), starred: false, updatedAt: now() }))] })),
      updateFile: (id, patch) => set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      deleteFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

      addLink: (l) => set((s) => ({ links: [...s.links, { ...l, id: uid("l") }] })),
      deleteLink: (id) => set((s) => ({ links: s.links.filter((l) => l.id !== id) })),

      resetWorkspace: () => set({ ...buildSeed(), view: { name: "today" }, history: [], focus: null }),
    }),
    {
      name: "mova-workspace",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as State;
        if (version < 3) {
          const seed = buildSeed();
          const addMissing = <T extends { id: string }>(have: T[], extra: T[]) => [...have, ...extra.filter((x) => !have.some((h) => h.id === x.id))];
          state.projects = addMissing(state.projects, seed.projects.filter((p) => p.id === "p-web" || p.id === "p-examples"));
          state.folders = addMissing(state.folders, seed.folders.filter((f) => f.id === "f-examples"));
          state.files = addMissing(state.files, seed.files.filter((f) => f.id.startsWith("ex")));
        }
        if (version < 2) {
          const seedFiles = buildSeed().files;
          const byId = new Map(seedFiles.map((f) => [f.id, f]));
          const have = new Set(state.files.map((f) => f.id));
          state.files = [
            ...state.files.map((f) => (byId.get(f.id)?.content !== undefined && f.content === undefined ? { ...f, content: byId.get(f.id)!.content } : f)),
            ...seedFiles.filter((f) => !have.has(f.id) && f.content !== undefined),
          ];
        }
        return state;
      },
      partialize: ({ searchOpen: _s, assistantOpen: _a, focus: _f, history: _h, ...rest }) => rest,
    },
  ),
);

export const projectById = (id?: ID) => (id ? useStore.getState().projects.find((p) => p.id === id) : undefined);
