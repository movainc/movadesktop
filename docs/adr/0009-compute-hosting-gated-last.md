# ADR-0009 — Student compute hosting ships last, gated, static-first

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering, sponsor, counsel (pending review)
- **Affects:** `knoxus-hosting`, `knoxus-cli`, budget, insurance

### Context

The brief specifies static hosting, non-static hosting, VPS (no sudo, 4-hour idle shutdown,
application required, very limited usage) and GPU hosting (shared VRAM, AI workloads only, no
commercial use, detailed application, minimum 4 GB). Offering compute to students turns the school
into a hosting provider: the school's IP space and brand end up fronting phishing pages, proxies,
crypto-mining, port scanning, and — in the worst case — child sexual abuse material. The credit rates
make the tier feel rationed, but they do not ration *cash*: the worst case lands on the school's cloud
bill, not on the student's balance.

### Decision

1. **Order of shipping:** static hosting → non-static (managed runtimes) → VPS → GPU, with each tier
   gated on the previous tier's abuse record.
2. **Static hosting is Phase 4.** It is the lowest-risk tier and delivers most of the educational
   value (a real URL for a project on `*.knoxus.au`).
3. **VPS and GPU are Phase 6 and gated** on: a passing isolation test suite; egress allowlist enforced
   outside the guest; platform-side idle watchdog and quota enforcement; per-student **and**
   school-wide budget circuit breakers with a documented ceiling; abuse detection on CPU and egress
   patterns; a no-deploy kill switch; legal sign-off; and confirmation of insurance cover for the
   activity.
4. **No unrestricted outbound network.** Allowlist only, no persistent outbound connections, no
   inbound except HTTP(S) via the platform's ingress. This single control removes most of the abuse
   value of the tier.
5. **No network path from student workloads to platform services or the platform database.** Databases
   are per-student isolated instances.
6. **Identity-bound availability.** Access follows the school account ([ADR-0004](0004-school-issued-identities-multi-tenant.md)),
   with application review for GPU and VPS, and a documented suspension process.
7. **Education credit programmes first.** The tier does not launch on commercial rates if a programme
   can fund it; if not, launch with a smaller cap rather than an unfunded liability.

### Consequences

- **Positive:** the riskiest feature is deferred until the platform has an abuse record, telemetry and
  a budget history; static hosting still satisfies most student projects early; abuse is contained by
  network policy rather than by trusting guests.
- **Negative / accepted cost:** students who want real servers must wait, and the GPU tier may prove
  unaffordable in cash terms regardless of how well it is designed. Saying that plainly is better than
  shipping it and discovering the bill.
- **Follow-up work:** isolation test suite (escape attempts, egress attempts, resource-exhaustion
  attempts), budget breakers wired to the ledger, abuse-detection signals, and a sponsor decision on
  the funding source.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Ship VPS/GPU early to win student enthusiasm | Puts unbounded abuse and cost on the school before any controls or track record exist |
| Drop compute hosting entirely | Rejects a well-argued part of the brief; static hosting is genuinely valuable and low risk |
| Trust the guest-side idle timer | A guest that can disable its own watchdog is not a control |
| Give students unrestricted internet "like real hosting" | The abuse potential is precisely why commercial hosts demand identity, payment and AUP enforcement — the school has less tolerance, not more |

### Compliance / safeguarding note

Compute is a reporting surface: hosted content can be illegal. Requires a documented escalation path,
a takedown SLA, and a named owner who can act within hours — not an email alias.
