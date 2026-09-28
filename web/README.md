# mova — web app

The browser version of mova, deployed to **https://movadesktopweb.vercel.app**.

It is the same React app as the desktop version (the source lives in `../src`), built with `vite --mode web`. The web version runs entirely in the browser:

| | Desktop | Web |
|---|---|---|
| Projects, tasks, calendar, notes, files, code editor, focus, search, tour | ✓ | ✓ |
| Sign in with Google | ✓ | ✓ |
| Workspace saved | On the device, plus optional sync to your Google Drive | In this browser |
| Edit files inside Google Drive | ✓ | — |
| AI assistant and suggestions | ✓ | — (API keys can't be kept safe in a browser) |

## Deploying on Vercel

1. Create a Vercel project from this repository and set **Root Directory** to `web`. Keep "Include files outside the root directory" enabled; it is on by default.
2. Add the environment variable **`VITE_GOOGLE_CLIENT_ID`**: the client ID of the *Web application* OAuth client, with `https://movadesktopweb.vercel.app` as an authorized JavaScript origin.
3. Deploy. `vercel.json` in this folder installs from the repo root and builds into `web/dist`.

## Local development

```bash
# from the repository root
VITE_GOOGLE_CLIENT_ID=… npm run dev:web     # http://localhost:1420
npm run build:web                           # output in web/dist
```
