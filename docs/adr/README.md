# Architecture decision records

One file per decision that is expensive to reverse. Format and rules: [0000-adr-template.md](0000-adr-template.md).
An accepted ADR is superseded by a *new* ADR that links back; numbers are never reused.

| ADR | Decision | Status |
|---|---|---|
| [0000](0000-adr-template.md) | Template | — |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | accepted |
| [0002](0002-web-first-spa-rust-backend.md) | Web-first SPA with a Rust back-end; Tauri desktop; Rust CLI | accepted |
| [0003](0003-modular-monolith-cargo-workspace.md) | Modular monolith in one Cargo workspace; one binary, role flags | accepted |
| [0004](0004-school-issued-identities-multi-tenant.md) | School-issued identities, multi-tenant schema, tenant-scoped handles | accepted |
| [0005](0005-chat-privacy-tiering.md) | Channel-tiered privacy; disclosed monitoring; no E2EE under 16 | **accepted, pending counsel** |
| [0006](0006-curated-finite-feed.md) | Curated, finite, chronological highlights — no recommender | accepted |
| [0007](0007-credits-append-only-ledger.md) | Credits as an append-only double-entry ledger; no real money | accepted |
| [0008](0008-ai-gateway-prompt-packs.md) | AI behind a gateway; versioned prompt packs; mandatory disclosure | **accepted, pending counsel** |
| [0009](0009-compute-hosting-gated-last.md) | Student compute ships last, static-first, egress-restricted | accepted |
| [0010](0010-tauri-desktop-shell.md) | Desktop client is a Tauri shell around the same SPA | accepted |

## Decisions deliberately not made yet

| Topic | Why deferred | Trigger to decide |
|---|---|---|
| Compute back-end vendor (Azure/GCP/AWS/OCI/DO) | Depends on education-credit availability | Before Phase 6 |
| Voice/video SFU vendor | Needs an abuse and cost test with real concurrency | Before Phase 3 voice |
| CSAM detection vendor | Requires counsel and safeguarding sign-off, not an engineering preference | Before Phase 3 |
| Telephony provider for "school number" calls | Number portability, consent and recording law are open questions | Before Phase 3 |
| App-store distribution | PWA-first removes the urgency ([ADR-0002](0002-web-first-spa-rust-backend.md)) | Post-pilot |
| Search infrastructure | Premature at current scale | Phase 5 |
