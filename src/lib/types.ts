export type ID = string;

export type Area = "School" | "Work" | "Personal" | "Content" | "Side projects";

export interface Project {
  id: ID;
  name: string;
  description: string;
  area: Area;
  color: string;
  icon?: string;
  deadline?: string;
  starred: boolean;
  createdAt: string;
}

export interface Task {
  id: ID;
  title: string;
  done: boolean;
  projectId?: ID;
  noteId?: ID;
  due?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Note {
  id: ID;
  title: string;
  body: string;
  projectId?: ID;
  updatedAt: string;
}

export interface CalendarEvent {
  id: ID;
  title: string;
  start: string;
  end: string;
  projectId?: ID;
}

export interface Folder {
  id: ID;
  name: string;
  parentId: ID | null;
}

export type FileKind = "pdf" | "doc" | "image" | "code" | "sheet" | "video" | "other";

export interface FileItem {
  id: ID;
  name: string;
  kind: FileKind;
  size: number;
  folderId: ID;
  projectId?: ID;
  starred: boolean;
  updatedAt: string;
  content?: string;
  driveId?: string;
}

export interface LinkItem {
  id: ID;
  title: string;
  url: string;
  projectId: ID;
}

export type View =
  | { name: "today" }
  | { name: "tasks"; filter?: "all" | "today" | "upcoming" | "inbox" | "done" }
  | { name: "projects" }
  | { name: "project"; id: ID; tab?: ProjectTab }
  | { name: "calendar" }
  | { name: "notes"; id?: ID }
  | { name: "files"; folderId?: ID; filter?: "starred" | "recent" | "drive" }
  | { name: "code"; fileId?: ID }
  | { name: "settings" };

export type ProjectTab = "overview" | "tasks" | "notes" | "files" | "calendar" | "links";

export type Theme = "system" | "light" | "dark";
