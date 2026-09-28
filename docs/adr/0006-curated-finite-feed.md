# ADR-0006 — Curated, finite, chronological highlights — no recommender

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** product, engineering
- **Affects:** feed service, highlights schema, parent view

### Context

The brief asks for a "scrolling system — similar to yt shorts or insta reels". Those products are
engagement-optimised, infinite, and autoplaying, and the evidence on their effects on adolescents is
what drove the Australian under-16 rules in the first place. Knoxus exists to *replace* phone use in
schools; rebuilding the most criticised mechanic would contradict the entire pitch and worsen the
legal classification problem.

### Decision

Highlights are **curated, finite, chronological collections** with an explicit end. Concretely:

- No watch-time or engagement ranking. Ordering is chronological within a curated collection.
- No autoplay of the next item, and no infinite scroll: the queue ends and says so.
- No public like counts or follower counts. Reactions are private to the creator's group at most.
- Parents see read-and-comment only.
- Collections are authored by staff (sport, CAS, Tartan Army, achievements, lesson recaps, assessment
  news) or generated from approved student submissions.
- Video generation is quota'd in **clips per week**, not in credits, and anything depicting a person
  requires recorded consent with teacher approval.

### Consequences

- **Positive:** directly supports the "sanctioned replacement for phones" positioning and the legal
  argument in [../PLAN.md](../PLAN.md) §3A; less moderation pressure because reach is bounded;
  parents can consume the same feed their children do without a different ranking secret.
- **Negative / accepted cost:** lower engagement by design, which some stakeholders will read as
  failure. The product must therefore report different success metrics: coverage (what share of
  students saw this week's notices), comprehension, and staff time saved.
- **Follow-up work:** publish the metrics in the roadmap and pilot exit criteria so "less addictive"
  is not mistaken for "broken"; build the collection authoring flow before any player polish.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Engagement-ranked feed | Contradicts the product's purpose and worsens the platform-classification risk |
| Infinite scroll with chronological order | Still a time sink; the infinite part does the damage, not the ranking |
| No video at all | Loses the school's key communication channel (recaps, sport, notices) |
| Short-form only, no collections | Removes the "catch up on what you missed" value that staff actually need |

### Compliance / safeguarding note

Finite, non-optimising feeds materially reduce exposure under the Australian under-16 rules and under
the "Safety by Design" expectations, and they avoid the algorithmic-amplification class of harm
entirely. Owner: product, reviewed at each phase gate.
