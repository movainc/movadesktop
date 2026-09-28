# ADR-0002 — Web-first SPA with a Rust back-end

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering
- **Affects:** `/web`, `/crates`, desktop client, `knoxus` CLI

### Context

The product needs: a browser client that works on school-managed Chromebooks and iPads; a desktop
build for the MovaInc-branded app implied by this repository; a back-end that fans out chat messages,
runs content classifiers over every message, keeps an exact-decimal ledger, and orchestrates media
and compute; plus a CLI for students. The available toolchain here is Node 24.21 and Python 3.14 —
`cargo` is **not** installed, so any Rust decision carries a setup cost.

Two options dominate the trade space: a single-language TypeScript stack (Next.js + Prisma), or a
web client with a Rust core.

### Decision

We will build the client as a **web-first SPA (React + Vite, installable PWA)** and the back-end as
**Rust** (`axum` + `tokio` + `sqlx`). The desktop app is a **Tauri v2 shell** (Rust) that loads the
same SPA. The CLI is a Rust binary. Types flow one way: Rust DTOs → OpenAPI 3.1 (`utoipa`) →
generated TypeScript.

### Consequences

- **Positive:** one language for back-end, desktop shell and CLI; the SPA is reused verbatim across
  web and desktop, so the desktop app is not a second UI codebase. Deployments are single static
  binaries per role with no interpreter or `node_modules` in production.
  Rust's type system is a genuine asset for invariants that must not be violated — consent state,
  channel visibility class, ledger entries, tenant scoping.
  A PWA also sidesteps app-store policy on UGC, minors' data and virtual-currency purchases, and
  lets us defer store distribution without blocking the product.
- **Negative / accepted cost:** slower contributor ramp-up and longer compile times than
  TypeScript; some school integrations have thinner Rust client libraries (mitigated by thin
  `reqwest`-based adapters); `rustup` must be installed before any code lands.
- **Follow-up work:** `rust-toolchain.toml`, `cargo-chef` layering and `sccache` in CI from the
  first commit, and an OpenAPI drift check so the client never silently lags the contract.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Next.js + Prisma, single language | Server rendering fights SPA reuse in the Tauri shell; would still need a Rust shell and CLI, so two languages anyway |
| Go back-end | Strong choice, but adds a third language next to the (already Rust) desktop shell |
| Electron desktop app | ~100 MB+ runtimes and a Chromium we must patch ourselves; Tauri reuses the OS webview |
| React Native / Flutter for everything | Poor fit for a desktop-first, browser-first product; school devices already have browsers |
| Native Rust UI (egui/iced) | Cannot reach the web target, which is the primary one |

### Compliance / safeguarding note

Not applicable directly. The PWA-first choice does reduce exposure to app-store rules governing
minors and virtual currency, which is recorded as a positive side effect rather than a reason.
