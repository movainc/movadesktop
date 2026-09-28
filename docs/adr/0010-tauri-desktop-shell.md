# ADR-0010 — Desktop client is a Tauri shell around the same SPA

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering
- **Affects:** desktop app (MovaInc-branded), `/web`, CI

### Context

This repository is described as the "Desktop App for MovaInc". The product plan is web-first
([ADR-0002](0002-web-first-spa-rust-backend.md)), so the desktop build must not become a second UI
codebase with its own bugs, its own design drift, and its own moderation-bypass opportunities. The
toolchain here has no Rust installed, so the shell is a Phase 2+ concern, but the decision shapes how
the SPA is written today.

### Decision

The desktop client is a **Tauri v2 shell** (Rust) that loads the same SPA build as the web client,
with a thin native layer limited to: secure token storage in the OS keychain, auto-update, window and
tray behaviour, and deep-link handling. **No product logic lives in the shell.** Web and desktop
differ only in packaging and in these native capabilities, both expressed as a capability interface
the SPA detects at runtime.

### Consequences

- **Positive:** one UI codebase; a fraction of the security surface of an Electron bundle (uses the
  OS webview, no bundled Chromium to patch); the desktop app cannot accidentally diverge into an
  unmoderated client.
- **Negative / accepted cost:** OS webview differences (WebView2 on Windows, WebKitGTK on Linux,
  WKWebView on macOS) mean visual and feature testing across three engines; no Rust toolchain in this
  environment yet, so the shell cannot be built until `rustup` is installed.
- **Follow-up work:** `rust-toolchain.toml`, Tauri project skeleton in `crates/desktop`, keychain
  integration, auto-update channel, and a CI matrix that builds the shell on all three platforms.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Electron app with its own renderer code | Duplicate UI and a much larger patch surface; the SPA would drift from the shipped app |
| Electron shell loading the same SPA | Better than a fork, but bundles Chromium and adds ~100 MB plus an update treadmill |
| Native UI toolkit (Qt/egui/iced) | Third UI implementation; cannot share the web target at all |
| No desktop app | Contradicts the repository's stated purpose; also the desktop client is the natural home for supervised school-machine use |

### Compliance / safeguarding note

Keeping the desktop client a *shell* guarantees every client enforces the same moderation, disclosure
and privacy-banner rules — a second client implementation is a second place for those guarantees to
be absent. Owner: engineering.
