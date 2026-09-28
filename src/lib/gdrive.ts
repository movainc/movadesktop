import { invoke } from "@tauri-apps/api/core";
import { useStore } from "./store";
import { ROOT_FOLDER } from "./seed";
import { kindFromName } from "../components/ui";
import type { AuthStatus } from "./auth";

export type DriveFile = {
  id: string;
  name: string;
  mime_type: string;
  modified_time: string;
  size: number | null;
  is_folder: boolean;
  web_view_link: string | null;
};

const TEXT_MIME = /^(text\/|application\/(json|xml|javascript|x-sh|x-python|sql|x-yaml|toml))/;
const TEXT_EXT = /\.(py|ts|tsx|js|jsx|mjs|json|md|txt|html|css|scss|rs|go|java|c|h|cpp|cs|sh|ya?ml|toml|sql|csv|xml|ini|env)$/i;

export const isEditable = (f: DriveFile) => !f.is_folder && !f.mime_type.startsWith("application/vnd.google-apps") && (TEXT_MIME.test(f.mime_type) || TEXT_EXT.test(f.name));

export const connectDriveFiles = () => invoke<AuthStatus>("auth_connect_drive_files");
export const listDrive = (parent?: string, query?: string) => invoke<DriveFile[]>("gdrive_list", { parent, query });
export const readDrive = (id: string) => invoke<string>("gdrive_read", { id });
export const writeDrive = (id: string, content: string) => invoke<string>("gdrive_write", { id, content });
export const createDrive = (name: string, parent: string | undefined, content: string) => invoke<string>("gdrive_create", { name, parent, content });

// Opens a Drive file in the editor: it is cached as a workspace file linked by driveId, and saves go back to Drive.
export async function openDriveFile(f: DriveFile) {
  const content = await readDrive(f.id);
  const store = useStore.getState();
  const existing = store.files.find((x) => x.driveId === f.id);
  if (existing) {
    store.updateFile(existing.id, { content, size: content.length, updatedAt: f.modified_time || new Date().toISOString() });
    store.go({ name: "code", fileId: existing.id });
    return;
  }
  store.addFiles([{ name: f.name, kind: kindFromName(f.name), size: content.length, folderId: ROOT_FOLDER, content, driveId: f.id }]);
  const all = useStore.getState().files;
  store.go({ name: "code", fileId: all[all.length - 1].id });
}
