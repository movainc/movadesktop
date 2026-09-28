# Technology stack

Decision: **web-first front-end, Rust core.** See [ADR-0002](../adr/0002-web-first-spa-rust-backend.md)
and [ADR-0003](../adr/0003-modular-monolith-cargo-workspace.md).

## 1. Shape

| Layer | Choice | Notes |
|---|---|---|
| Web client | Vite + React 19 + TypeScript, installable PWA | Primary client. Ships offline-capable shell |
| Desktop client | Tauri v2 (Rust shell) wrapping the same SPA | MovaInc-branded desktop build; no second UI codebase |
| HTTP/WS API | `axum` on `tokio` | One binary family, role flags: `api`, `worker`, `chat-gateway`, `migrate` |
| Data | PostgreSQL 16+ via `sqlx` (compile-time checked SQL) | `tenant_id NOT NULL` on every tenant-scoped table |
| Cache / presence / queues | Redis (`fred`) | Presence, rate-limit buckets, job queues (or `apalis` on Postgres for v1) |
| Media | `ffmpeg` sidecar + S3-compatible storage + CDN | HLS for highlights; sidecar keeps the binary lean |
| Realtime | `axum` WebSocket upgrade, `mediasoup` SFU for community voice | Rust for chat fan-out; SFU is external and behind an interface |
| Search | Deferred to Phase 5 (`meilisearch` or `OpenSearch`) | Do not add in v1 |
| CLI | `clap` 4 binary, `knoxus` | `init`, `login --no-launch-browser` (device-code grant), `deploy`, `logs`, `env`, `db connect`, `credits` |
| Types | `utoipa` → OpenAPI 3.1 → `openapi-typescript` | One contract for the SPA, the CLI and any future school integration |
| Observability | `tracing` + OpenTelemetry (OTLP) + Prometheus metrics | Trace IDs echoed to the client for support |

## 2. Cargo workspace layout

```
/Cargo.toml                  # cargo workspace root
/crates/
  knoxus-core/               # domain types + invariants, zero I/O
  knoxus-db/                 # sqlx repositories, migrations
  knoxus-api/                # axum handlers (thin), OpenAPI generation
  knoxus-auth/               # OIDC/SSO, sessions, RBAC, audit trail
  knoxus-moderation/         # classifiers, multi-message window scoring, escalation
  knoxus-ai/                 # model registry, prompt packs, provider adapters
  knoxus-ledger/             # double-entry credits, rust_decimal
  knoxus-connector/          # knoxi! adapter trait + swappable backends
  knoxus-hosting/            # static / VPS / GPU control plane (Phase 4 & 6)
  knoxus-server/             # composition root; the only binary that binds ports
  knoxus-cli/                # `knoxus` binary
  knoxus-types/              # DTOs exported to TypeScript
/web/                        # pnpm workspace: SPA, generated API client, shared UI
/infra/                      # Dockerfiles, Terraform, DNS, policy files
/docs/
```

**Modular monolith, not microservices.** One deployable with hard crate boundaries. Splitting later
is a deployment change; starting split makes every Phase 1 change a distributed-systems change.

## 3. Performance where it actually matters

Rust is not a substitute for indexes and query discipline. The budgets that justify the choice:

| Path | Target (p95, intra-region) | Dominant cost |
|---|---|---|
| Chat message send → recipient receives | < 150 ms | Fan-out, presence lookup |
| Feed / profile read | < 250 ms | SQL + payload size, not language |
| Inline text moderation decision | < 400 ms | Provider latency (route async) |
| Media moderation | Async, < 60 s | Video decode; never inline |
| Credits ledger commit | < 20 ms, serialised per account | Row lock on account head |

Guardrails: no N+1 queries in a handler (repository layer forbids per-item loops), `sqlx` compile-time
verification in CI, load tests (`oha`/`k6`) on chat fan-out and the ledger before Phase 3.

## 4. Deliberate non-choices

| Rejected | Why |
|---|---|
| Node/Next.js back-end | Would still need Rust for the Tauri shell and the CLI; one back-end language beats two. Server-rendering also fights the PWA/desktop-shell reuse |
| Go | Fine tool, but the desktop shell is already Rust — one language across shell, server and CLI |
| Microservices or K8s in v1 | Operationally unjustifiable at this team size |
| GraphQL | OpenAPI + typed generation is simpler for a CLI, a SPA and school integrations |
| A "crypto-native" ledger | Credits are an accounting problem, not a blockchain problem |

## 5. Honest costs of this choice

| Cost | Mitigation |
|---|---|
| Rust ramp-up for contributors | Keep async surface thin; `knoxus-core` is pure, well-tested, easy first work |
| Compile times | `cargo-chef` layer caching, `sccache`, incremental CI, deny-by-default on new deps |
| `cargo` absent here | `rust-toolchain.toml` pinned; install `rustup` at the first code commit |
| Small dependency ecosystems for some school-specific integrations | Isolate behind traits in `knoxus-connector`, keep adapters dumb |

## 6. CI gates (from the first code commit)

`cargo fmt --check` · `cargo clippy -- -D warnings` · `cargo test` · `cargo deny` (licences +
advisories) · `cargo audit` · `sqlx` offline-mode build check · `openapi-typescript` drift check
(contract regenerates cleanly) · `pnpm lint test build` · Playwright smoke on the SPA ·
migration dry-run against a `testcontainers` Postgres · abuse suite (§ threat model §7).

## 7. Web client specifics

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript, Vite build, `vite-plugin-pwa` for the installable shell |
| Data | TanStack Query (server state) + TanStack Router (typed routes) |
| Forms | TanStack Form + Zod, sharing schemas with the generated API types |
| Styling | Tailwind + Radix primitives; design tokens in `web/src/design-tokens.ts` |
| i18n | ICU message format; AI translation is *content*, never a substitute for UI strings |
| Tests | Vitest unit · Playwright smoke + accessibility assertions |

**Client budgets** (they exist because school Wi-Fi and ageing Chromebooks are the real environment):

- Initial JS ≤ 200 KB gzip; route-level code splitting mandatory.
- LCP ≤ 2.5 s on a mid-tier Chromebook over school Wi-Fi; no layout shift from fonts.
- Images and video lazy-loaded; no autoplay video; no third-party scripts.
- Accessibility: WCAG 2.2 AA as a gate, keyboard-complete, visible focus, reduced-motion honoured.
  A school product that fails a11y fails the students who need it most.

**No third-party analytics, trackers or ad SDKs, ever.** Behavioural telemetry about minors is a
liability with no upside; self-hosted, aggregate-only metrics are the ceiling.

Practical risks to plan for: school-managed devices may block PWA installation or push
notifications, so the product must be fully usable in a plain browser tab; and iOS PWA push has
platform caveats — do not make a feature depend on it.

*See [PLAN.md](../PLAN.md) for scope and phase sequencing.*
