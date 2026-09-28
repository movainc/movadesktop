import type { CalendarEvent, FileItem, Folder, LinkItem, Note, Project, Task } from "./types";

export const PROJECT_COLORS = ["#7C6FC4", "#4D4D4D", "#5E7FA8", "#6F9C84", "#C49A5E", "#B8707A"];

export const ROOT_FOLDER = "root";
export const SHARED_FOLDER = "f-shared";

export function buildEmpty() {
  return {
    projects: [] as Project[],
    tasks: [] as Task[],
    notes: [] as Note[],
    events: [] as CalendarEvent[],
    folders: [
      { id: ROOT_FOLDER, name: "Home", parentId: null },
      { id: SHARED_FOLDER, name: "Shared", parentId: ROOT_FOLDER },
    ] as Folder[],
    files: [] as FileItem[],
    links: [] as LinkItem[],
  };
}
