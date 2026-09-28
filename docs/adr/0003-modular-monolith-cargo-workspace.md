# ADR-0003 — Modular monolith in one Cargo workspace

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering
- **Affects:** `/crates`, deployment topology, CI

### Context

Knoxus has eight or so distinct subsystems (posting, chat, feed, profiles, communities, AI gateway,
credits ledger, compute control plane). The instinct on a project this size is to start with
microservices, since the domains feel separate. In practice the subsystems share identity, tenancy,
moderation and the audit trail, and a small team operating a distributed system will spend its time
on infrastructure instead of on the safeguarding features that actually gate the product.

### Decision

We will build **one Cargo workspace** of crates with hard module boundaries
(`knoxus-core`, `knoxus-db`, `knoxus-api`, `knoxus-auth`, `knoxus-moderation`, `knoxus-ai`,
`knoxus-ledger`, `knoxus-connector`, `knoxus-hosting`, `knoxus-server`, `knoxus-cli`,
`knoxus-types`), and deploy **one binary** whose role is a flag: `api`, `worker`, `chat-gateway`,
`migrate`. Compile-time enforcement via crate boundaries replaces the network boundary:
`knoxus-core` performs no I/O, and only `knoxus-server` binds ports.

### Consequences

- **Positive:** refactors stay type-checked across subsystem boundaries; one migration stream, one
  transaction boundary, one auth model. Deployment is a container per role from a single image, so
  scaling chat and workers independently is still possible.
  Splitting a crate into a service later is a deployment change, not an architectural rewrite.
- **Negative / accepted cost:** a single build graph means long cold builds unless caching is
  configured; `knoxus-server` risks becoming a god-crate if discipline lapses.
- **Follow-up work:** forbid cross-crate cycles in CI (`cargo deny` + dependency graph check), and
  keep handler crates thin — business logic lives in the domain crates with unit tests.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Microservices from day one | Distributed transactions for the ledger, 8× the CI and observability surface, and no team to operate it |
| Separate repositories per service | Version skew and cross-repo PR choreography for every change |
| Single flat crate | No compile-time boundaries; the invariants would be unenforceable |
| Serverless functions | Cold starts on chat fan-out, per-invocation cost model fights the budget caps |

### Compliance / safeguarding note

One binary with one audit-trail implementation is a *safer* compliance posture than eight services
with eight logging paths: access to peer-chat content must be impossible to do unlogged, and
centralising that logic is how the guarantee stays true.
