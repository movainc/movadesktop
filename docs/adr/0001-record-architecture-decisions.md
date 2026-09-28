# ADR-0001 — Record architecture decisions

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** project maintainers
- **Affects:** `/docs/adr`, all future work

### Context

Knoxus is a platform handling minors' data, chat monitoring, AI-generated content, a virtual economy
and student-run compute. Most of its expensive decisions are irreversible in practice: the tenancy
model, the privacy tiering of channels, the ledger design, and where student code is allowed to run.
Undocumented decisions in a project like this get relitigated every few months, and the *reasoning*
is what gets lost — the code survives, the rationale does not.

### Decision

We will record every architecturally significant decision as a numbered ADR in `/docs/adr`,
following [ADR-0000](0000-adr-template.md). An ADR is required before, not after, implementation of
anything that changes: tenancy, identity, data retention, channel privacy, AI providers or prompts,
the credits ledger, or student compute isolation.

### Consequences

- **Positive:** decisions become reviewable, including by the school and by counsel, without reading
  code. Onboarding accelerates because "why is it like this?" has a file.
- **Negative / accepted cost:** a small writing overhead on every significant change, and discipline
  is required or the folder rots into a museum.
- **Follow-up work:** keep `docs/adr/README.md` as the index; ADRs 0002–0010 land with this batch.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Rely on commit messages and PR descriptions | Not discoverable; no status lifecycle; die with the repo history rewrite |
| A wiki or Notion page | Drifts from the code, no review trail, no version control |
| One big design doc | Unmaintainable at this scope; conflicts become hard to resolve |

### Compliance / safeguarding note

Not applicable to the decision itself, but the ADR process is the mechanism by which the school can
audit *why* a monitoring feature exists — which is exactly what a safeguarding review will ask for.
