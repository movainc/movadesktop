# Knoxus — handoff

**Read me first.** This is the entry point for anyone (person or agent) picking this work up.

| | |
|---|---|
| **State** | Pre-code. Documentation and a documentation site only — **no application code exists** |
| **Repository** | `movainc/movadesktop`, branch `main` |
| **Last verified** | docs site builds clean and the audit passes (`node site/tools/audit.mjs`, exit 0) |
| **Blocked on** | A written go/no-go from the school and counsel before Phase 3 (chat) — see §4 |
| **Owner** | Unassigned. Sponsor, safeguarding lead and counsel are all unnamed — **that is itself a risk** |

---

## 1. Where things stand

Done and verified:

- **18 markdown documents** in `docs/` — plan, stack, 11 ADRs, threat model, DPIA skeleton, credits
  model — written to be defensible rather than optimistic, including the parts that argue against
  features in the original brief.
- **A static documentation site** generated from those documents (`site/`), zero dependencies, no
  external requests, WCAG 2.2 **AAA** contrast verified by an automated audit, with the built output
  committed so it can be opened straight from a checkout.
- **An audit gate** (`site/tools/audit.mjs`) covering contrast, structure, labels, link resolution and
  build freshness. It exits non-zero on failure and is meant to run in CI.

Not started: everything else. No Cargo workspace, no web client, no database, no school integration,
no legal sign-off.

## 2. Read in this order (about an hour, in this order for a reason)

| Time | Read | Why it matters to you now |
|---|---|---|
| 10 min | [docs/PLAN.md](docs/PLAN.md) §1–§3 | What the product is, and the three findings that reshaped it |
| 15 min | [ADR-0005 chat privacy tiering](docs/adr/0005-chat-privacy-tiering.md) | The decision everything else hangs off. Read the rejected alternatives too |
| 10 min | [ADR-0004 identities](docs/adr/0004-school-issued-identities-multi-tenant.md) | Why there is no signup, and why that is load-bearing for safety and cost |
| 10 min | [docs/architecture/STACK.md](docs/architecture/STACK.md) §1–§2 | The shape you will be building: web SPA + one Rust binary family |
| 10 min | [docs/threat-model/THREAT-MODEL.md](docs/threat-model/THREAT-MODEL.md) §6 | 18 abuse cases. This is the specification for what "working" means here |
| 5 min | [docs/compliance/DPIA.md](docs/compliance/DPIA.md) §9 | The ten questions currently blocking chat. If you can answer any of them, you are useful immediately |

Then skim the rest: [stack](docs/architecture/STACK.md), [ADR index](docs/adr/index.md),
[credits model](docs/economics/CREDITS-MODEL.md), [docs index](docs/README.md).

## 3. Decisions already made

Ten accepted ADRs; two of them are marked *accepted, pending counsel* and must not be treated as
settled until that review happens:

| ADR | Decision in one line | Status |
|---|---|---|
| [0001](docs/adr/0001-record-architecture-decisions.md) | Record architecture decisions | accepted |
| [0002](docs/adr/0002-web-first-spa-rust-backend.md) | Web-first SPA (React/Vite PWA) + Rust back-end + Tauri desktop shell + Rust CLI | accepted |
| [0003](docs/adr/0003-modular-monolith-cargo-workspace.md) | Modular monolith, one Cargo workspace, one binary with role flags | accepted |
| [0004](docs/adr/0004-school-issued-identities-multi-tenant.md) | School-issued SSO identities, `tenant_id` everywhere, handles per tenant | accepted |
| [0005](docs/adr/0005-chat-privacy-tiering.md) | Channel-tiered privacy; disclosed monitoring; no E2EE under 16; no VC recording; no 1:1 adult↔minor voice | **pending counsel** |
| [0006](docs/adr/0006-curated-finite-feed.md) | Curated, finite, chronological highlights; no recommender, no infinite scroll | accepted |
| [0007](docs/adr/0007-credits-append-only-ledger.md) | Credits as an append-only double-entry ledger; no real money; isolated investment pool | accepted |
| [0008](docs/adr/0008-ai-gateway-prompt-packs.md) | AI behind one gateway; versioned prompt packs with lint + evals; mandatory AI labelling | **pending counsel** |
| [0009](docs/adr/0009-compute-hosting-gated-last.md) | Student compute ships last, static-first, egress-restricted, budget-capped | accepted |
| [0010](docs/adr/0010-tauri-desktop-shell.md) | Desktop client is a Tauri shell around the same SPA | accepted |

Deliberately **not** decided yet (see the bottom of the [ADR index](docs/adr/index.md)): compute
back-end vendor, voice/video SFU, CSAM detection vendor, telephony provider, app-store distribution,
search infrastructure. Each has a stated trigger for when it must be decided.

## 4. The gates — respect the order

These are not bureaucratic decoration; getting them out of order is how this project becomes either
unlawful or untrustworthy. Each is a hard gate.

1. **Written school sanction** — the product must be school-authorised. Independence changes the legal
   and ethical analysis of every monitoring feature. Nothing in §7 starts until this exists.
2. **Counsel review of chat** — the ten questions in [DPIA §9](docs/compliance/DPIA.md) cover the
   under-16 platform rules, monitored chat, retention, mandatory reporting and cross-border AI.
   **Do not build chat before these are answered.** ADR-0005 and ADR-0008 are explicitly marked
   *pending counsel* for this reason.
3. **Named safeguarding owner** — a human, on duty, reachable by phone, who owns the escalation path
   ([PLAN §9](docs/PLAN.md) kill criterion 5). An email alias is not an owner.
4. **Funding decision for compute** — the compute tier has no cash budget yet. [CREDITS-MODEL §4](docs/economics/CREDITS-MODEL.md)
   shows why virtual rates hide a real bill of thousands per month at scale.
5. **Phase order** — no compute before static hosting, no economy before the platform is stable, no
   AI before the gateway exists. [PLAN §6](docs/PLAN.md) is the sequence.

## 5. Invariants — do not trade these away quietly

Each is enforced by design or by an ADR. If a change is needed, write a superseding ADR; do not
"temporarily" relax them.

- **No covert monitoring.** Every channel is either disclosed-as-monitored or private-by-default.
- **No E2EE claim** on any channel a school has a duty to oversee. Honest tiering, not false promises.
- **No measurement of under-16 accounts by third parties.** No analytics, no ad SDKs, no third-party
  scripts on any student surface, ever — the docs site follows the same rule.
- **No recording** of voice or video, by anyone, including staff.
- **No 1:1 adult↔minor private voice/video**, ever.
- **No real money.** Credits are earned, never purchased, never redeemed.
- **No engagement-ranked feed, no autoplay chain, no infinite scroll.**
- **No unrestricted egress** for student compute; no network path from student workloads to platform
  services or the platform database.
- **AI is always disclosed**, in-band and in metadata. AI never acts autonomously on a student.
- **Boring backups of the boring invariants:** one account per student (SSO), `tenant_id` on every
  scoped row, balances derived from an append-only ledger, no student credentials stored.

## 6. Working with the documents

The markdown in `docs/` (plus `HANDOFF.md` here) is the **source of truth**. The site in `site/dist/`
is generated and **must never be hand-edited** — the audit fails if the committed build drifts from
its sources.

```sh
node site/build.mjs         # regenerate site/dist from the markdown
node site/serve.mjs         # preview on http://localhost:4173
node site/tools/audit.mjs   # contrast, structure, links, freshness — must exit 0
```

Conventions worth keeping:

- **One h1 per document**; sections start at `##`, subsections at `###`. The generator promotes
  ADR-style `###`-only documents to `##` so the outline never skips a level.
- **ADR header blocks** (`- **Status:** …` directly under the `#` heading) render as a status card and
  a badge. Keep that shape.
- **Relative markdown links only** — `[PLAN.md](PLAN.md)`. The generator rewrites them for the site and
  the audit fails on any link that does not resolve, so a typo becomes a build failure rather than a
  404 nobody notices.
- Adding a document means adding an entry to `PAGES` in `site/build.mjs`; the array order defines the
  sidebar, the previous/next chain and the landing-page cards.
- **Never relax the audit to make it pass.** For example, the two theme border colours are deliberately
  darker than they look natural in order to satisfy the 3:1 UI-component rule. If a check is wrong,
  change the check loudly and explain it; do not delete it.

## 7. Phase 0 checklist — the concrete first tasks

Ordered so that each step is verifiable and none of them depend on the school's answers. Estimated at
one to two focused weeks for one engineer; the SSO spike is the long pole because it needs school IT.

| # | Task | Done when |
|---|---|---|
| 0.1 | Install `rustup`, pin `rust-toolchain.toml`, install `pnpm` | `cargo --version` and `pnpm --version` work; both recorded in the toolchain file |
| 0.2 | Create the Cargo workspace from [STACK §2](docs/architecture/STACK.md): `knoxus-core`, `knoxus-db`, `knoxus-api`, `knoxus-server`, `knoxus-types` as empty crates with a hello-world `axum` route | `cargo run -p knoxus-server -- api` serves `/healthz` |
| 0.3 | CI: `cargo fmt --check`, `clippy -D warnings`, `cargo test`, `cargo deny`, `cargo audit`, `sqlx` offline check, `node site/tools/audit.mjs` | All green on an empty PR; the docs audit runs on every docs change |
| 0.4 | Postgres + `sqlx` migrations, `tenant_id NOT NULL` convention, `TenantContext` type in `knoxus-core` | A migration creates `tenants`/`users`/`memberships`; a repository call cannot compile without a tenant context |
| 0.5 | Tenancy guard tests | A test attempts a cross-tenant read and fails with 403 plus an audit entry ([threat model](docs/threat-model/THREAT-MODEL.md) AC-16, red-team row 1) |
| 0.6 | SPA shell: Vite + React + TS + TanStack, design tokens, PWA manifest, OpenAPI → TS generation wired | `pnpm dev` serves an empty shell; a generated client file is checked in and regenerates cleanly |
| 0.7 | SSO spike against the school identity provider (OIDC/SAML) | A real school account logs in; roles come from claims; **the only step that needs an external party** |
| 0.8 | Audit trail skeleton: append-only `audit_events`, actor + reason + subject | Writing and reading an audit event is a covered test, not a convention |

The first five PRs I would write, in order: workspace skeleton → CI gates → tenant context + guard
test → audit trail → SSO spike. Everything after that is Phase 1 (profiles, posting, curated feed) as
specified in [PLAN §6](docs/PLAN.md).

## 8. Open questions and unknowns

Blocking (need a person, not code):

| Question | Who can answer | Notes |
|---|---|---|
| Is this school-sanctioned, and in writing? | Sponsor + principal | Gate 1 |
| Which school and jurisdiction — Knox Grammar NSW, or another Knox? | Sponsor | The docs assume NSW. Victoria changes the surveillance-device analysis |
| Chat model accepted (ADR-0005) or changed? | Product + sponsor + counsel | Gate 2 |
| The ten DPIA §9 questions | Counsel | Gate 2 |
| Who is the safeguarding owner, on call? | School leadership | Gate 3 |
| Is compute funded, and by what? | Sponsor | Gate 4; see CREDITS-MODEL §4 for the numbers |
| Education cloud credits (Azure/AWS/GCP for Education) available? | School IT / finance | If yes, the compute tier becomes viable; if no, launch it smaller or not at all |

Technical unknowns to verify before relying on them:

- **`knoxi!` has no confirmed public API.** Do not assume one; plan for an export file or IMAP ingest
  ([PLAN §4.2](docs/PLAN.md)) and get written permission before scraping anything.
- **The AI model named in the brief could not be verified.** The design deliberately hides the model
  behind a registry ([ADR-0008](docs/adr/0008-ai-gateway-prompt-packs.md)) so this stays a config
  question, not an architecture question.
- **The under-16 exclusion instrument (F2025L00889) was not read in full** — the fetch returned raw
  PDF bytes. Counsel must confirm the carve-outs.
- **The credit rates are internally consistent, not costed.** Confirmed by arithmetic: 8 vCPU/32 GB at
  28.8 credits/hour means a 30-credit day buys about an hour of the ceiling instance, and GPU hours
  imply days of saving. What is *not* verified is the school's cash exposure — that is §4 of the
  credits model, and it is the one number that can kill the developer tier.

## 9. Environment notes and gotchas

- **`cargo` is not installed in the dev container.** Node 24.21, npm 11.19 and Python 3.14 are present.
  This is the first thing to fix; see task 0.1.
- **The docs tooling needs no dependencies at all** — Node's standard library, ESM, `node:fs` and
  `node:crypto`. Do not add a `package.json` to `site/`; the whole point is that a fresh clone can
  build and verify the docs offline.
- **The site makes no network requests**, by design and by audit. Keep it that way: no webfonts, no
  CDN, no analytics, not even a "harmless" one.
- **`site/dist/` is committed.** That is a deliberate choice so the docs are readable straight from a
  checkout, and it is why the freshness check exists. If you would rather treat it as build output,
  gitignore it *and* keep `tools/audit.mjs` as the CI gate — do not do one without the other.
- **The shell integration in this environment sometimes reports exit code 1 for commands that
  succeeded.** Verify real status by redirecting output and echoing `$?`, e.g.
  `node site/tools/audit.mjs > /tmp/a.txt 2>&1; echo "exit=$?"; cat /tmp/a.txt`.
- **Keep the audit green as you edit docs.** A renamed heading breaks TOC anchors; a renamed file
  breaks links; both fail loudly rather than 404ing in front of the school.

## 10. Verification evidence — last known good

Reproduce all of it with:

```sh
node site/build.mjs > /tmp/build.txt 2>&1; echo "exit=$?"; cat /tmp/build.txt
node site/tools/audit.mjs > /tmp/audit.txt 2>&1; echo "exit=$?"; cat /tmp/audit.txt
```

Expected (and last observed):

| Check | Result |
|---|---|
| Build | `pages: 19 + landing page`, `search: 120+ sections indexed`, `checks: clean`, roughly 40–110 ms |
| Contrast | **38 pairs pass** AAA — 19 token pairs × 2 themes (body text 16.4–16.7:1; borders 3.2–3.4:1; focus rings 10.5–13.8:1) |
| Structure | 20 pages checked: doctype, lang, meta, skip link, `main`, one `h1`, no heading-level jumps, scoped table headers, labelled landmarks and controls |
| Integrity | No external resource references, every internal link and TOC anchor resolves |
| Freshness | Build fingerprint matches sources; a deliberately staled document made the audit fail with a precise message, then passed again after restoring it byte-identically |
| Preview server | `200` for pages and the landing page, `404` for missing paths, path traversal rejected |
| Asset sizes | CSS 25 KB, JS 11 KB, search index ~84 KB, total `site/dist` ~596 KB |

Two defects were found and fixed during that verification, and they are worth knowing about because
both classes can recur: ADR meta cards silently stopped rendering because the extractor did not skip
the blank line after the title, and ADR pages jumped from `h1` to `h3`. The audit now catches the
second class; the first is the reason to keep the "no `](`  left in output" and "no `undefined`" checks.

## 11. First day, first week

**Day one:** read §2 above; run the three commands in §6 and see the audit pass; then read
[ADR-0005](docs/adr/0005-chat-privacy-tiering.md) end to end. Do not start coding on day one.

**Week one:** work the Phase 0 checklist in §7 in order, and in parallel chase the six blocking
questions in §8 — they are all conversations, not code, and they are on the critical path. The single
highest-value thing you can do is get gate 1 (written sanction) and gate 2 (counsel review) moving,
because every chat feature, every monitoring capability and the entire developer tier sit behind them.

**If you only do one thing:** install the toolchain, get `cargo test` and the docs audit both green in
CI, and make the tenancy guard test fail loudly on a cross-tenant read. That small foundation is what
makes the safety invariants in §5 enforceable instead of aspirational.

**Traps that have already caught someone:**

- Treating the docs as aspirational. They are the specification; the abuse cases are the acceptance
  criteria.
- Assuming an integration exists (`knoxi!`) or a model exists because it was named in a brief.
- Assuming the credit economy is costed because the arithmetic is self-consistent.
- Building the fun parts (feed, economy, compute) before the boring ones (identity, tenancy, audit).
- Relaxing an audit check instead of fixing the design. That is exactly how accessibility and safety
  guarantees rot, and it will be invisible until someone outside the team looks.

---

*Everything here is a snapshot. If you change a decision, supersede the ADR — and update this file,
because the next person's first ten minutes depend on it.*



