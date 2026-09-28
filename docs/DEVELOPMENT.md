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
| `npm run screenshots` | Regenerate `docs/screenshots/` (needs `npx vite preview --port 4174` running) |

## AI during development

Either export the key in your shell before running:

```bash
export MOVA_OPENAI_API_KEY=sk-...
npm run tauri dev
```

or paste it into **Settings → AI** in the running app. Don't put keys in the repo; `.env` files are git-ignored.

## Project layout

```
src/                 React UI (see ARCHITECTURE.md)
src-tauri/           Tauri app (Rust)
  src/ai.rs          AI commands and key storage
  tauri.conf.json    window, bundle and security config
  icons/             app icons (generated from app-icon.svg)
public/              static assets (favicon)
docs/                documentation and screenshots
licenses/            upstream licence files shipped with the app
scripts/             tooling (screenshots)
```

## Regenerating icons

```bash
npx tauri icon src-tauri/app-icon.svg
```

## Code style

- TypeScript `strict`, no unused locals or parameters.
- Design values come from tokens in `src/styles/tokens.css`; don't hard-code colours in components.
- Keep components small and colocated with their view. Shared pieces go in `src/components/`.
- Store selectors must return stable references. Select the raw array, then filter in the component. Selectors that build new arrays cause render loops in Zustand v5.

## Release checklist

1. Bump `version` in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
2. `npm run typecheck && npm run build`.
3. `npm run tauri build` on each target OS (or in CI).
4. Sign and notarise: set up Apple and Windows code-signing per the Tauri docs.
5. Make sure `LICENSE`, `THIRD_PARTY_NOTICES.md` and `licenses/` ship with the release.
