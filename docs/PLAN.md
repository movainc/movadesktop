# Knoxus — Product & Delivery Plan

Status: **planning / pre-code.** Owner: TBD. Last updated: 2026-09-28.
Related: [architecture/STACK.md](architecture/STACK.md) · [adr/](adr/) · [threat-model/THREAT-MODEL.md](threat-model/THREAT-MODEL.md) · [compliance/DPIA.md](compliance/DPIA.md) · [economics/CREDITS-MODEL.md](economics/CREDITS-MODEL.md)

---

## 1. What Knoxus is

A school-scoped social platform: posting for school / teachers / students, messaging with AI
assistants, a vertical video feed, rich profiles, communities (including voice), a currency +
marketplace economy, and a developer-hosting tier. Built for one school first, multi-tenant by
design so it can expand to other schools without a rewrite.

**Intended positioning: the sanctioned replacement for always-on phones**, not another app competing
with them. Every scope decision below is judged against that positioning, because it is also the
strongest legal footing the product can stand on (§3A).

## 2. Delivery shape

- **Front-end: web-first.** An installable PWA is the primary client. It shares one codebase with a
  thin desktop shell (Tauri v2, Rust core) for the MovaInc-branded desktop app.
- **Back-end: Rust.** One Cargo workspace, one binary family with role flags
  (`api | worker | chat-gateway | migrate`). Rationale, crate choices and trade-offs:
  [STACK.md](architecture/STACK.md), [ADR-0002](adr/0002-web-first-spa-rust-backend.md).
- **Why this pairing:** Tauri's shell is already Rust, so backend, desktop shell and the `knoxus` CLI
  are one language, and the SPA is reused verbatim across web and desktop. Rust earns its place in
  chat fan-out, moderation throughput, the exact-decimal ledger, and single-binary deploys.
- **PWA-first also dodges app-store policy** on UGC, minors' data and virtual-currency purchases
  for under-18s. Store distribution is a later, deliberate decision — not a Phase 1 dependency.

## 3. Three findings that reshape the brief

### A. The under-16 social media rules are the biggest existential risk

A product with profiles, posts, a reels feed, DMs and communities sits close to the statutory
archetype of an "age-restricted social media platform" under the *Online Safety Amendment (Social
Media Minimum Age) Act 2024* (Cth). The defence is **not** marketing copy; it is design:

| Design lever | Required choice |
|---|---|
| Feed | Curated, finite, chronological. No engagement-optimised ranking, no autoplay loop |
| Accounts | School-issued, SSO-bound, no public signup, no strangers on-platform |
| Framing | Positioned as a school-authorised education/community service; confirm carve-out scope |
| Mechanism fit | If it must not exist for under-16s, there is no lawful "but it's for school" override |

Practical consequence: the *Scrolling system* must be a **curated highlights feed**, not TikTok.
That single change improves safety, is better for the school pitch, and reduces legal exposure.

### B. "Proposal A vs Proposal B" is a false binary — and E2EE is incoherent with the rest of the spec

The brief asks for chats that the school can monitor, teachers can steer with AI replies, and that
auto-flag drugs/vapes/sexualised language *across multiple messages*. That requires plaintext on the
server. **That is not end-to-end encryption** — and client-side detection is bypassed by a modified
client in about an hour, leaving you with E2EE's liability *plus* a false safety promise.

Resolution: **tier by channel, not by platform.** Privacy comes from narrowing *who* can read plus
logging and dual control — not from a cryptographic claim the product cannot honour.
True E2EE is offered later as an opt-in tier for **16+ / alumni** accounts, where it can be honoured.

| # | Channel | Who can read | AI behaviour | Retention / privacy model |
|---|---|---|---|---|
| 1 | School notice, group channel | Everyone in scope | Teacher prompt-pack replies, always AI-labelled | None expected; disclosed in-channel |
| 2 | Staff↔student DM | Student, teacher, school admin; guardian on request | Disclosed assistant only — never a "friend" bot | Safeguarding record; per records policy |
| 3 | Staff↔parent (incl. simulated calls) | Staff, parent, school | AI triage + disclosure on calls | Logged and retained |
| 4 | Peer DM, private community | Participants **and** server-side classifiers; human review needs **dual control + logged justification** | Auto-escalation on self-harm / drug / grooming signals to a human | Private-by-default, not secret-by-default |
| 5 | Public community, community VC | All members | AI moderation; live safety signals | **No recording**, ever |
| 6 | Escalation bot | Triage only | Routes to a human counsellor; never acts autonomously | Audit-logged |

Two hard safety invariants, enforced at the schema and gateway layers: **no 1:1 adult↔minor private
VC** (require a third participant or a guardian-visible lobby), and **no VC recording** (in NSW,
recording a private conversation without consent is an offence, and a minor cannot validly consent to
their own surveillance).

Keep the brief's "AI mark at the end": every AI message carries `ai_generated: true` plus model and
prompt-pack identifiers, rendered as a visible badge *and* written to the audit log. It is the single
cheapest trust mechanism in the product.

### C. The developer-hosting tier is the riskiest subsystem and the least budgeted

Offering students VPS/GPU compute turns the school into a hosting provider for minors. The realistic
abuse set: phishing and proxy hosting on a school IP range, crypto-mining, port scanning, and
CSAM-hosting liability. It is also the only feature whose cost scales with *worst-case* behaviour
(see [CREDITS-MODEL.md](economics/CREDITS-MODEL.md) §4: ~US$7k–14k/month if an 800-student tenant
maxes out instances at commercial cloud rates).

Controls that are non-optional if this tier ever ships: egress allowlist with no persistent outbound,
image allowlist, no sudo (already in the brief), pre-emptible instances, a 4-hour idle watchdog
enforced by the *platform* rather than the guest, per-student and school-wide budget circuit
breakers, abuse detection on CPU/egress patterns, and a kill switch an admin can hit without a
deploy. Sequence it **last** ([ADR-0009](adr/0009-compute-hosting-gated-last.md)).

## 4. Subsystem specifications

### 4.1 Posting

Three scopes, with a publisher gate on the highest-reach surface:

| Scope | Who | Rules |
|---|---|---|
| School-wide | School account, approved staff | Announcements, events, achievements; schedulable; pinnable |
| Group-wide | Teachers | Their classes, year groups, houses, cocurricular groups (Tartan Army, CAS teams) |
| Student | Students | Group-scoped by default; "submit to school feed" **requires teacher approval** |

The approval gate earns its friction: it gives quality *and* a human in the loop before anything
reaches every student and every parent.

Moderation runs **pre-publish** on text and images, not post-hoc — a school-wide post cannot be
un-seen by 800 students.

### 4.2 `knoxi!` connector

Assume no API exists until school IT proves otherwise. One trait, swappable backends, in order of
preference: documented API → scheduled export (CSV/JSON) → email/IMAP ingest → manual paste →
headless scrape (last resort; brittle, and needs written permission). Requirements: idempotent ingest
keyed on source ID, provenance recorded on every copied item (`source: knoxi`, `source_id`,
`fetched_at`), no silent edits, and a mandatory "review before publish" step for anything scraped.
An automated mirror of an internal staff system into a social feed is a data leak waiting to happen.

### 4.3 Highlights (the "scrolling system")

Curated, finite, chronological collections — sport, CAS, Tartan Army, achievements, lesson recaps,
assessment news, fun clips. "Catch up on what you missed" is the organising idea. Explicitly **not**
a recommender: no watch-time ranking, no autoplay chain, no infinite scroll. Parents get read and
comment only. This is the choice that most differentiates Knoxus from the platforms the school is
trying to displace, and [ADR-0006](adr/0006-curated-finite-feed.md) locks it in.

Video generation ("1-prompt video") gets a **hard quota in clip count**, a teacher-approved showcase
path for anything featuring students, provenance metadata on every output, and an explicit rule that
no student or staff likeness is used without recorded consent. Deepfake and non-consensual-imagery
risk is the reason this is not an open, unlimited feature.

The "iframe feature" (teacher pastes a link, platform generates the embed) is a security surface:
server-side metadata fetch with SSRF defences, an allowlisted domain set, `sandbox` attribute and
strict CSP on the frame, and no cookies or storage access to platform origins. Useful, but build it
behind the allowlist from day one.

### 4.4 Profiles

`guns.lol`-style: handle `@jexample30_knox` (the tenant suffix *is* the expansion strategy),
changeable display name, avatar, custom fonts and cosmetics bought with credits, outbound links
(GitHub, projects, achievements, sport), community memberships, highlights.

Security notes that are easy to miss:

- User-supplied **fonts and cosmetics are stored-XSS vectors**. Allow only a vetted
  font/colour/asset catalogue — never raw CSS or uploaded SVG.
- Link previews and embeds are fetched server-side, so SSRF via URL metadata is a real attack path;
  resolve, then validate, then allowlist.
- OAuth connections (e.g. GitHub) must store refresh tokens encrypted, request the narrowest scopes,
  and be revocable in one tap. A leaked link token is a student account takeover.
- AI checks on profile media are moderation, not decoration.

Privacy defaults: school-only visibility for minors, no global discoverability, no follower counts in
v1, opt-in fields only.

### 4.5 Communities

Browse, join, and create up to 3 per student; public (discoverable) or private (invite link only);
mixed year groups; teachers may join with **no automatic privileges**; multilingual with AI
translation and AI moderation; every community has a voice channel with screen share.

The uncomfortable truth to design around: **private communities are where harmful content lives.**
Invite-only must not mean unmoderated — content signals stay server-side for private communities too
([ADR-0005](adr/0005-chat-privacy-tiering.md)) — and moderators are members with a duty, not owners
with a fiefdom. Invite links expire, are single-use, are bound to a tenant, and are revocable;
an invite that leaks to the open internet must be worthless within minutes.

Voice: **unrecorded**, AI live-signal monitoring only, screen share requires a per-session consent
state plus a persistent visible indicator, and no 1:1 adult↔minor channel (restricted to public
community channels where at least one other member is present).

### 4.6 AI

- **Gateway, not a hardcoded model.** The brief names "DeepSeek v4.1 Flash", which cannot be verified
  from here, and sending minors' data cross-border to a third-party model raises genuine
  cross-border-disclosure obligations. So: a model registry, per-tenant provider policy, in-region
  default, no-training contractual guarantee, and reasoning-effort plus response-length as *config*
  ([ADR-0008](adr/0008-ai-gateway-prompt-packs.md)).
- **Prompt packs** (`AGENTS.md` done properly): versioned in-repo, semver, per-tenant overrides,
  forbidden-content lint, an eval suite of golden transcripts plus jailbreak tests, and a per-tenant
  kill switch. Teachers *will* write bad prompts; lint and evals are what make that survivable.
- **Always labelled**: visible badge, `ai_generated` metadata, and an audit entry holding model,
  prompt-pack version and hash. AI never impersonates a person, and never gives medical, legal or
  crisis advice — those route to a human ([ADR-0005](adr/0005-chat-privacy-tiering.md) channel 6).
- **Cost control**: per-call metering into the credits ledger, per-tier quotas, and async routing so a
  slow provider never blocks a message send.

### 4.7 CLI and the developer platform

`knoxus init` · `knoxus login [--no-launch-browser]` (OAuth device-code grant; tokens in the OS
keychain, never a repo file) · `knoxus deploy` (content-addressed artifact, atomic release, instant
rollback) · `knoxus logs` · `knoxus env pull|push` · `knoxus db connect` (proxied, short-lived
credentials — students never hold raw connection strings to a shared database) · `knoxus credits`.

Ship order: **static hosting** (Phase 4, lowest risk) → **non-static** (Phase 6) → **VPS** (Phase 6,
application required) → **GPU** (Phase 6, detailed application, shared VRAM, AI workloads only, no
gaming emulators, no commercial use, minimum 4 GB VRAM allocation).

Platform prerequisites, none of which are optional:

- Wildcard `*.knoxus.au` DNS with automated ACME issuance and **tenant-subdomain-takeover
  protection** (reserve names, verify ownership before issuing).
- Per-student isolation of anything that runs code, with no network path from student workloads to
  platform services or the platform database. "Connect a database" means *their* isolated database,
  never a shared instance.
- Idle watchdog and quota enforcement live in the control plane, not in the container.
- Every deployment, connect and scale action written to an audit log with actor and justification.

## 5. Permission matrix

| Action | Student | Teacher | School admin | Parent |
|---|---|---|---|---|
| Post school-wide | Submit for approval | Submit for approval | ✔ | — |
| Post group-wide | Own groups only | Own classes/groups | ✔ | — |
| Post to highlights | Submit | ✔ (own groups) | ✔ | — |
| Create community | 3 max | 3 max | Unlimited | — |
| Comment on highlights | ✔ | ✔ | ✔ | ✔ (read + comment only) |
| Voice channel | ✔ (2+ participants rule) | ✔ (no privileges) | ✔ | — |
| View staff↔student DM | Own | Own | On request, logged | On request, logged |
| View peer DM | Own | Dual control, logged reason | Dual control, logged reason | With student opt-in only |
| Set AI prompt packs | — | ✔ | ✔ | — |
| Approve compute access | — | — | ✔ | — |

## 6. Roadmap

| Phase | Weeks | Ships | Exit criteria |
|---|---|---|---|
| **0 — Foundations** | 0–1 | Cargo + pnpm workspace, ADRs, threat model, DPIA skeleton, design tokens, SSO + tenant + roles | Real accounts log in; one ADR per irreversible decision; CI green with zero features |
| **1 — Vertical slice** | 2–5 | Profiles, posting (3 scopes), curated feed, moderation v1 | 50-student pilot; zero PII leaks; moderation precision/recall measured and published |
| **2 — Highlights** | 6–10 | Video upload → HLS, comments, parent read-only view, lesson/assessment recaps | Transcode, copyright and takedown SLA working |
| **3 — Chat** | 11–16 | The §3B channel taxonomy, prompt packs + AI labelling, escalation to human, guardian visibility, school-number calling | Mandatory-reporting SOP drilled; consent coverage ≈ 100%; audit log proven under adversarial review |
| **4 — Communities + CLI** | 17–22 | Public/private communities, invite lifecycle, 3-community cap, AI translation/moderation, unrecorded voice, `knoxus init/login/deploy`, static hosting, ledger v1 | Red-team passes on invite leakage, unmoderated-room escape, deploy rollback |
| **5 — Economy** | 23–30 | Missions, shop, monitored trades, investment sim on delayed market data, quota'd video generation, iframe builder | Cost per active student within budget; no randomised-reward mechanics |
| **6 — Compute (gated)** | 31+ | VPS and GPU tiers, idle watchdog, application flows | Isolation suite passes, egress abuse ≈ 0, budget breakers load-tested, legal sign-off, insurance in place |

This is a 2–4 year platform for a real team. The sequencing front-loads a usable slice so the school's
written sanction can be earned with something that already works.

## 7. Non-goals for v1

E2EE peer chat · real money anywhere (including purchasable credits) · open signup · engagement-ranked
or infinite feed · raw VPS with unrestricted internet · external tenants · autonomous AI action on
self-harm signals · app-store distribution · third-party analytics or ad SDKs of any kind.

## 8. Compliance workstream (parallel, never "later")

DPIA and guardian-consent records · records of processing and a retention schedule (safeguarding
records are typically kept well beyond graduation — confirm against the school's records authority) ·
staff access policy with dual control · mandatory-reporting SOP mapped to *human* mandatory reporters
with a defined SLA · eSafety / image-based-abuse reporting path · CSAM detection and escalation
(never staff-viewed, never stored locally) · AI use policy and disclosure standard · vendor DPAs for
LLM, telephony, CSAM and video-generation providers · external penetration test before Phase 3 ·
incident-response runbook.

## 9. Kill criteria

Stop and re-plan if any of these hold:

1. Counsel concludes a school-authorised service of this shape cannot lawfully serve under-16s.
2. The school will not put monitoring policy in writing.
3. Pilot cost per active student exceeds the agreed budget in two consecutive months.
4. Moderation cannot hold a documented response SLA on harmful content in the pilot.
5. No owner can be found for the safeguarding escalation path (a named human, on duty, with a phone).

## 10. Open decisions

| # | Decision | Recommended default | Owner |
|---|---|---|---|
| 1 | Jurisdiction / school | Knox Grammar, NSW (unverified) | Sponsor |
| 2 | Sanctioned vs independent | Sanctioned, co-designed with the school | Sponsor |
| 3 | Chat model | Tiered per §3B; E2EE only for 16+ / alumni | Product + counsel |
| 4 | Feed | Curated, finite, chronological | Product |
| 5 | AI provider | Registry with in-region default and no-training DPA | Product + counsel |
| 6 | Compute hosting | Static only in v1; VPS/GPU gated to Phase 6 | Sponsor |
| 7 | Repo relationship | This repo becomes the Knoxus monorepo; the MovaInc-branded desktop app lives in it as the Tauri client | Eng |
| 8 | Funding for the compute budget | Education credit programmes first, cash second | Sponsor |

## 11. Next steps

1. Get items 1, 2 and 3 from §10 answered in writing — they gate everything else.
2. Send the questions in [compliance/DPIA.md](compliance/DPIA.md) §9 to counsel.
3. On go: Phase 0 scaffold — `rust-toolchain.toml`, Cargo workspace per [STACK.md](architecture/STACK.md) §2,
   `pnpm` workspace, CI gates, SSO proof-of-concept against the school identity provider.

*End of plan. No code exists yet; this document and its siblings are the Phase 0 input.*
