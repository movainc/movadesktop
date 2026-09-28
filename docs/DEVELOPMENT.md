# Development

## Prerequisites

- **Node.js 20+** and npm
- **Rust** (stable) via [rustup](https://rustup.rs)
- **Tauri system dependencies**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Microsoft C++ Build Tools and WebView2 (preinstalled on Windows 11)
  - Linux (Debian/Ubuntu):
    ```bash
    sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev libsoup-3.0-dev build-essential
    ```

See https://tauri.app/start/prerequisites/ for other platforms.

## Setup

```bash
git clone https://github.com/movainc/movadesktop.git
cd movadesktop
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run tauri dev` | Run the desktop app with hot reload |
| `npm run dev` | Run only the UI in a browser at http://localhost:1420 (AI disabled) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck and build the UI into `dist/` |
| `npm run tauri build` | Build installers for your OS (`src-tauri/target/release/bundle/`) |
| `npm run tauri build -- --no-bundle` | Build just the app binary |
| `npm run dev:web` / `npm run build:web` | Run or build the web app (output in `web/dist`) |
| `node website/build.mjs` | Build the marketing website (output in `website/dist`) |
| Open `docs/` with any static server | The docs site is plain files in `docs/`, with no build step |
| `npm run screenshots` | Regenerate `docs/screenshots/` with a test account and demo data from `scripts/demo/` (needs `npx vite preview --port 4174` running; Node 22+) |

## Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Used by | What it is |
|---|---|---|
| `MOVA_GOOGLE_CLIENT_ID` | Desktop (`tauri dev`) | Client ID of the **Desktop app** OAuth client. Optional: you can paste the client JSON on the sign-in screen instead |
| `MOVA_GOOGLE_CLIENT_SECRET` | Desktop | Its client secret |
| `MOVA_OPENAI_API_KEY` | Desktop | OpenAI key for the AI features. Optional: or use Settings → AI |
| `VITE_GOOGLE_CLIENT_ID` | Web (`dev:web`, `build:web`) | Client ID of the **Web application** OAuth client |
| `MOVA_SITE` | Vercel root build | `web`, `website` or `docs`: which site to build |

In debug builds the desktop app reads `MOVA_*` values from `.env.local` / `.env` at runtime; release builds ignore these files. Vite reads `VITE_*` values itself. Real `.env` files are git-ignored; only the `.env.example` templates are committed. See [Google sign-in](AUTH.md) for creating the OAuth clients.

In development builds the sign-in screen also offers **Continue with test account**, a local-only account that never appears in release builds.

## Project layout

```
src/                 React UI, shared by the desktop and web apps (see ARCHITECTURE.md)
src-tauri/           Desktop app, native layer (Rust)
  src/ai.rs          AI commands and key storage
  src/auth.rs        Google sign-in, Drive sync and Drive file access
  tauri.conf.json    window, bundle and security config
  icons/             app icons (generated from app-icon.svg)
web/                 Web app: Vercel config and notes (builds src/ into web/dist)
website/             Marketing website (movadesktop.vercel.app)
docs/                Documentation in Markdown plus the docs website that renders it (movadocs.vercel.app)
public/              Static assets (favicon)
licenses/            Upstream licence files shipped with the app
scripts/             Tooling: screenshots, demo data, Vercel build
.github/workflows/   CI and cross-platform releases
```

## Deploying the sites

There are three Vercel projects, all importing this repository:

| Project | URL | Root Directory | Environment variables |
|---|---|---|---|
| movadesktop | https://movadesktop.vercel.app | `website`, or `./` | `MOVA_SITE=website` if the root is `./` |
| movadesktopweb | https://movadesktopweb.vercel.app | `web`, or `./` | `VITE_GOOGLE_CLIENT_ID`, plus `MOVA_SITE=web` if the root is `./` |
| movadocs | https://movadocs.vercel.app | `docs`, or `./` | None; `MOVA_SITE=docs` if the root is `./` |

With Root Directory `./`, the repository's `vercel.json` runs `scripts/vercel-build.sh`, which builds the site named by `MOVA_SITE` (or guesses from the domain). Each folder also has its own `vercel.json` for when its folder is used as the Root Directory. Each folder's `.env.example` lists its variables.

The desktop app isn't deployed to Vercel. See [Downloads & releases](RELEASES.md).

## Regenerating icons

```bash
npx tauri icon src-tauri/app-icon.svg
```

## Code style

- TypeScript `strict`, no unused locals or parameters.
- Design values come from tokens in `src/styles/tokens.css`; don't hard-code colours in components. The docs site uses a copy in `docs/assets/tokens.css`; CI checks they match, so copy the file over when you change it.
- Keep components small and colocated with their view. Shared pieces go in `src/components/`.
- Store selectors must return stable references. Select the raw array, then filter in the component. Selectors that build new arrays cause render loops in Zustand v5.

## Release checklist

1. Bump `version` in `package.json` (the desktop app reads it from there) and `src-tauri/Cargo.toml`.
2. `npm run typecheck && npm run build`.
3. `npm run tauri build` on each target OS (or in CI).
4. Or just push a `v*` tag: GitHub Actions builds and publishes every platform ([details](RELEASES.md)).
5. Sign and notarise: set up Apple and Windows code-signing per the Tauri docs.
6. Make sure `LICENSE`, `THIRD_PARTY_NOTICES.md` and `licenses/` ship with the release (the bundle config includes them).
