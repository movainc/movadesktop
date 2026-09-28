# Architecture

```
┌──────────────────────────── mova desktop (Tauri 2) ────────────────────────────┐
│                                                                                 │
│  Web UI  (React 19 + TypeScript, Vite)          Native layer  (Rust)            │
│  ─────────────────────────────────────          ─────────────────────────────   │
│  views/        one file per screen              src-tauri/src/lib.rs  app setup │
│  components/   shared UI, panels, palette       src-tauri/src/ai.rs   AI calls, │
│  lib/store.ts  Zustand store (persisted)  ───►   key storage                    │
│  lib/ai.ts     typed wrappers ── invoke() ────►  ai_status / ai_configure /     │
│  lib/monaco.ts local Monaco + workers            ai_forget_key / ai_complete    │
│                                                         │                       │
└─────────────────────────────────────────────────────────┼───────────────────────┘
                                                          ▼
                                            OpenAI Chat Completions API
```

## Frontend

| Path | Purpose |
|---|---|
| `src/App.tsx` | Shell: sidebar, current view, overlays (search, focus, assistant), global shortcuts |
| `src/views/*` | Today, Tasks, Projects, ProjectDetail, Calendar, Notes, Files, Code, Settings |
| `src/components/*` | Sidebar, TaskPanel, SearchPalette, FocusMode, Assistant, AiSuggest, Logo, UI primitives |
| `src/lib/store.ts` | Single Zustand store: data, navigation, UI state, actions |
| `src/lib/seed.ts` | Sample workspace, generated relative to today's date |
| `src/lib/types.ts` | Domain types: `Project`, `Task`, `Note`, `CalendarEvent`, `Folder`, `FileItem`, `LinkItem`, `View` |
| `src/lib/dates.ts` | Date helpers (no dependency) |
| `src/lib/ai.ts` | AI client: talks to the Rust layer, builds prompts and workspace context |
| `src/lib/monaco.ts` | Bundles Monaco and its workers locally; defines `mova-light` / `mova-dark` editor themes |
| `src/styles/tokens.css` | Design tokens (colour, radius, shadow, type) for light and dark |
| `src/styles/app.css` | Component styles |

**Navigation** is a small typed union (`View`) kept in the store; `go(view)` pushes history and `back()` pops it. There is no router, which is deliberate: the desktop app has no URLs.

**Persistence.** The store is persisted with `zustand/middleware/persist` to the webview's local storage under `mova-workspace`. It is versioned: `migrate()` adds new seed content (for example the example code files) without overwriting user data. Transient UI state (search, focus, assistant, history) is not persisted.

**The Code view is lazy-loaded** (`React.lazy`), so Monaco (~1.3 MB, plus language workers) loads only when you open the editor. Monaco is bundled locally, not from a CDN, so it works offline.

## Data model

Everything links through IDs:

```
Project ─┬─< Task ── noteId ──> Note
         ├─< Note
         ├─< FileItem ── folderId ──> Folder (tree)
         ├─< CalendarEvent
         └─< LinkItem
```

A task can have a `due` date and, separately, a scheduled time block (`scheduledStart`/`scheduledEnd`). That is how an intention becomes time on the calendar. Deleting a project detaches its items instead of deleting them.

## Native layer

`src-tauri` is a standard Tauri 2 app. The only custom code is `ai.rs`:

- The key is resolved in this order: the `MOVA_OPENAI_API_KEY` env var, then a key saved in Settings (in `<app config dir>/ai.json`, mode `0600` on Unix).
- `ai_complete` posts to OpenAI Chat Completions with `reqwest` (rustls) and caps the reply at 600 tokens.
- The key never crosses into the web UI; the UI only sees `{ configured, model, source }`.

## Design system

- The palette is taken from the logo: surfaces `#FFFFFF / #F7F7F7`, charcoal `#4D4D4D`, ink `#171717`, and one accent, violet `#7C6FC4`.
- Type is Inter Variable (bundled): a 13px base, section labels in 11px uppercase, and 24px titles with tight tracking.
- Borders are 1px `#E8E8E8`, radii 6/8/12px, shadows appear only on hover and overlays, and motion is 120–180ms ease-out.
- Dark mode redefines the same tokens; components never hard-code colours.

## Roadmap to the full platform

| Part | Planned tech |
|---|---|
| Backend API | TypeScript |
| Database | PostgreSQL |
| File storage | Object storage |
| Realtime sync | TypeScript / WebSockets |
| Search | PostgreSQL full-text first, dedicated search later |
| AI services | Python |
| Security / crypto services | Rust |
| Mobile | Swift + Kotlin or React Native |

The store's shape maps directly onto those tables. Moving to sync means replacing the persistence layer, not the UI.
