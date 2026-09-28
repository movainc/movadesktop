# Knoxus — documentation

**Status: planning / pre-code.** This directory is deliberately docs-only — no source code has been
written yet. The repository currently holds only these documents and the root `README.md`.

## Read in this order

| Doc | What it answers |
|---|---|
| [PLAN.md](PLAN.md) | Product plan: scope, load-bearing findings, subsystems, roadmap, kill criteria |
| [architecture/STACK.md](architecture/STACK.md) | The web-first + Rust decision in detail: crates, layout, deploy, budgets |
| [adr/](adr/) | One numbered file per irreversible decision |
| [threat-model/THREAT-MODEL.md](threat-model/THREAT-MODEL.md) | Assets, actors, abuse cases, trust boundaries, controls |
| [compliance/DPIA.md](compliance/DPIA.md) | DPIA skeleton + the questions to send to counsel |
| [economics/CREDITS-MODEL.md](economics/CREDITS-MODEL.md) | Credit rates, faucets/sinks, real-dollar exposure |

## Standing assumptions (all unverified — confirm before Phase 0)

1. **School-sanctioned product**, not an independent or rogue service. Everything in the compliance
   track depends on this.
2. **Knox Grammar School, NSW jurisdiction**, inferred from the "Tartan Army" and "CAS" references.
   If this is *The Knox School* (VIC) the surveillance-device and privacy analysis changes materially.
3. **Under-16 accounts are in scope**, so the Australian *Online Safety Amendment (Social Media
   Minimum Age) Act 2024* (Cth) applies as a design constraint until counsel says otherwise. A
   legislative instrument (F2025L00889, made 30 Jul 2025) carves out certain service categories; the
   exact wording has **not** been verified in this repo.
4. No verified public API exists for `knoxi!`. Integration is planned as an adapter with swappable
   backends, and school IT cooperation is tracked as an unresolved dependency.

## Non-negotiable constraints

These are design invariants, not preferences. Each is enforced in an ADR.

- **No covert monitoring.** Every channel is either disclosed-as-monitored or private-by-default.
  A child who is told has no expectation of privacy to breach; a child who is not told has one.
- **No real money, anywhere.** Credits are earned, never purchasable. No IRL-value investments.
- **No 1:1 adult↔minor private video calls.** No video-call recording, at all.
- **No engagement-ranked feed**, no autoplay loop, no infinite scroll.
- **No unrestricted outbound network** for student compute.
- **AI is always disclosed** in-band and in machine-readable metadata.

## Toolchain gap (blocks Phase 0, not this doc set)

`cargo` is **not installed** in this environment. Node 24.21, npm 11.19 and Python 3.14 are present.
Pin the toolchain in `rust-toolchain.toml` at the first code commit.

## Status board

- [x] Recon: repository state, toolchain, Australian legal baseline
- [x] Plan, ADRs, threat model, DPIA skeleton, credits model
- [ ] Go/no-go: written school sanction + counsel read on the under-16 rules and on chat monitoring
- [ ] Phase 0: Cargo + pnpm workspace scaffold, SSO, tenant model
