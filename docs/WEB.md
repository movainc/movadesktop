# Web app

The web version of mova runs at **[movadesktopweb.vercel.app](https://movadesktopweb.vercel.app)**. It's the same app as the desktop version — same screens, same design, same Google sign-in — running in your browser.

## What's the same

Today, Projects, Tasks, Calendar, Notes, Files, the Code editor, Focus, Search, themes, project icons and the guided tour all work the same way.

## What's different

| | Desktop | Web |
|---|---|---|
| Where your workspace is saved | This device, optionally synced to your Google Drive | This browser |
| Workspace sync between devices | ✓ | — |
| Open and edit files inside Google Drive | ✓ | — |
| AI assistant and suggestions | ✓ | — |
| Works offline | ✓ | — |
| Uploaded files | Text and code files are kept for editing | Text and code files are kept for editing; browsers limit storage to a few MB |

Why the web version is lighter:

- **AI** needs an API key, and a key can't be kept secret inside a web page.
- **Drive sync and Drive editing** need long-lived Google permissions that are safest in a native app.

## Your data on the web

Your workspace is saved in your browser's storage, separately for each Google account. It stays on that browser — clearing site data or using a private window removes it. For a workspace that follows you, use the desktop app with Drive sync.

## Deploying it

The web app is built from the same source (`src/`) with `npm run build:web`. See [Development](DEVELOPMENT.md#deploying-the-sites) for Vercel settings.
