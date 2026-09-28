# Sync & Google Drive

The desktop app works with Google Drive in two separate ways. Both are optional and desktop-only.

## Workspace sync

Keep your workspace on this computer **and** in a private folder in your Google Drive, so it follows you to other computers.

- Turn it on at sign-in (**This device + Google Drive**) or in **Settings → Account → Where your workspace is saved**.
- mova stores one file, `mova-workspace.json`, in Drive's **app data folder** — a hidden area only mova can read. It doesn't appear in your Drive and mova can't see your other files through it.
- **When it syncs:** at sign-in, and a few seconds after each change. **Sync now** is in the account menu and in Settings.
- **If two computers change things:** the most recently saved workspace wins. The sync badge under your name shows *Synced*, *Syncing…* or *Sync problem* (click your name for details).

## Editing files inside Google Drive

Browse your Drive and open, edit and save files **in place** — the file stays in your Drive.

1. Open **Files → Google Drive** (under *Cloud* in the folder list).
2. Press **Connect Google Drive** and allow access in your browser. This asks for permission to see and edit your Drive files.
3. Browse folders or search by name.
   - **Text and code files** (for example `.py`, `.ts`, `.md`, `.json`, `.csv`, `.txt`, up to 2 MB) open in mova's **code editor**. Changes save back to Drive about a second after you stop typing — the status bar shows *Saved to Drive*.
   - **Google Docs, Sheets, Slides, PDFs and images** open in your browser.
4. **New file** creates a file in the current Drive folder and opens it.

Files you open appear in the Code view's explorer under **Google Drive**.

## Removing access

- Turn sync off in **Settings → Account**, or sign out.
- To revoke mova's Drive permissions entirely, visit [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Web app

The web app keeps your workspace in the browser and doesn't connect to Google Drive. Use the desktop app for sync and Drive editing.
