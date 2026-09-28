# Credits economy — model, rates and exposure

The brief's own numbers are internally consistent, which is a good sign. This document records the
formulas, checks the faucets against the sinks, and works out the real-dollar exposure that the
virtual rates conceal. See [ADR-0007](../adr/0007-credits-append-only-ledger.md).

## 1. Rates (as specified)

| Resource | Rate | Unit |
|---|---|---|
| CPU | 2 credits | per vCPU-hour |
| RAM | 0.4 credits | per GB-hour |
| VRAM | 5 credits | per GB-VRAM-hour (minimum 4 GB) |
| Compute ceiling | 8 vCPU / 32 GB | per instance, anti-abuse cap |
| Daily earn cap | 30 credits | excl. investment proceeds |
| Minimum activity runway | ~4 days | for "most purchaseable items" |

VRAM implies the headline GPU prices in the brief: 96 GB × 5 = **480/hr** (RTX Pro 6000),
80 GB × 5 = **400/hr** (H100). One day on a full RTX Pro 6000 = 480 × 24 = **11 520 credits**.

## 2. Worked examples — are the numbers sane?

| Instance | Formula | Credits/hour | Hours per 30-credit day |
|---|---|---|---|
| 2 vCPU / 4 GB (dev box) | 2×2 + 4×0.4 | 5.6 | ~5.4 h |
| 4 vCPU / 8 GB | 4×2 + 8×0.4 | 11.2 | ~2.7 h |
| 8 vCPU / 32 GB (ceiling) | 8×2 + 32×0.4 | 28.8 | ~1.04 h |
| H100 80 GB | 80×5 | 400 | 13.3 **days** of saving |
| RTX Pro 6000 96 GB | 96×5 | 480 | 16 **days** of saving |

Conclusions: the "cannot run a maxed instance 24/7" property holds, the ceiling is self-enforcing,
and GPU access is effectively a rare, application-gated privilege rather than a feature. That is the
intended behaviour — keep it.

## 3. Faucets and sinks

| Faucet (credits in) | Notes | Sink (credits out) | Notes |
|---|---|---|---|
| Missions, activity streaks | Capped at 30/day per account | Compute (VPS/GPU) | Dominant sink; inherently elastic, needs a hard cap |
| Investment proceeds | **Separate pool**, cannot raise the daily spend cap | AI credits (replies, images, video) | Metered per call; video is the most expensive line |
| Rewards from approved community events | School-controlled, small | Cosmetics, fonts, profile items | Primary cosmetic sink |
| — | — | Advertising (own project/community/video) | Good sink: no marginal cost to the school |
| — | — | Physical goods, trades, limited cosmetics | Needs a fulfilment budget and abuse review |

**Rule that keeps the economy from breaking:** gains from the investment pool must **not** be
spendable at the same rate as earned credits. Otherwise compounding turns into unlimited compute and
the daily cap stops binding.

## 4. The cost the virtual rates hide

Credits are not money, so the *real* constraint is the platform's cash budget. Worst case for the
maxed instance at ~US$0.30–0.60/hour of cloud vCPU+RAM:

| Scenario | Real cost |
|---|---|
| One student maxed, 1.04 h/day | ~US$0.30–0.60 / student-day |
| 200 maxed students | ~US$60–120 / day (~US$1 800–3 600 / month) |
| 800 maxed students | ~US$240–480 / day (~US$7 000–14 000 / month) |

Free compute gets abused, so plan for the worst case, not the average:

1. **Education credit programmes** (Azure/AWS/GCP for Education) — target marginal cost ≈ 0 before
   offering the tier at all. This is the single highest-leverage action in this document.
2. **Two circuit breakers:** per-student monthly cap *and* a school-wide global cap that pauses new
   compute provisioning with a visible reason (never silently fail).
3. **SSO-bound single identity** — one account per student, which is what makes the earn cap real.
   Without it, alt accounts multiply both the cap and the cost.
4. **Video generation is the spikiest line item** (~US$0.05–1.00 per clip). Quota it in *count*, not
   credits, and consider a teacher-approved weekly showcase instead of open generation.
5. **Never let credits be purchased with money** — it converts play money into real consumer
   purchases by minors, and pulls in consumer-law and app-store obligations.

## 5. Anti-abuse on the earn side

| Vector | Control |
|---|---|
| Alt accounts farming missions | SSO identity, device fingerprint correlation, mission idempotency keys |
| Mission farming by automation | Server-side mission evaluation from real events, never client claims |
| Mining / proxy on student compute | Egress allowlist, no persistent outbound, CPU-pattern + egress anomaly detection, pre-emptible instances |
| Ledger tampering | Append-only double-entry journal; balances are derived, never written |
| Trade laundering between accounts | Trade monitoring, value-band heuristics, school review for large transfers |

## 6. Tuning levers (in order of preference)

1. Mission grant values and the daily cap (blunt but instant).
2. Compute rate multiplier — a single config value, not a code change.
3. Per-tier quotas (video clips/week, AI credits/day).
4. Instance ceiling (8 vCPU / 32 GB) and idle timeout (4 h).
5. Cosmetics prices (the mirror-image lever: raise prices before raising the cap).

Every lever lives in tenant config, versioned, with an effective date — never hardcoded, because the
economy will be re-tuned after the first month of real data.

## 7. Open questions for the sponsor

1. Who funds the compute budget, and what is the monthly ceiling before the global circuit breaker
   trips?
2. Are education credit programmes (Azure/AWS/GCP for Education) available through the school's
   existing agreements? If yes, the marginal cost of the compute tier approaches zero and the tier
   becomes politically viable.
3. Do guardians see a student's balance and transaction history? (Recommendation: yes for minors,
   read-only — hiding it invites the same suspicion the platform is trying not to create.)
4. Are physical-item redemptions fulfilled centrally by the school, and who owns the stock risk?
5. Can students gift credits to each other, or only trade items? (Gifting is a bullying and
   favouritism vector; recommendation: items only, value-banded, monitored.)
6. Which market-data licence covers the investment simulation, and is a delayed feed acceptable?
   (Delayed data usually is; real-time usually is not, without a vendor agreement.)

## 8. Invariant summary

- Balances are **derived** from an append-only journal and never written directly.
- The **grant** cap (30/day) is enforced at grant time; the spend side is bounded by budget breakers.
- **Investment proceeds cannot** be spent as freely as earned credits, or the cap stops binding.
- Every rate and price is **tenant config with an effective date**, versioned, and auditable.
