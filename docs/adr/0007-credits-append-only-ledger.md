# ADR-0007 — Credits as an append-only double-entry ledger; no real money

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering, product, sponsor
- **Affects:** `knoxus-ledger`, missions, shop, trades, compute billing, AI metering

### Context

The brief specifies a currency earned through activity (capped at ~30 credits/day), spendable on
cosmetics, advertising, physical goods, AI credits and compute (2 credits/vCPU-hour, 0.4/GB-RAM-hour,
5/GB-VRAM-hour), with monitored peer trading and an investment simulation synced to real markets.

Money systems attract fraud, and a mutable `balance` column makes every dispute unauditable and every
race condition a duplicated spend. The "investment" feature also creates a compounding faucet that
can silently defeat the daily cap if proceeds are spendable like earned credits. Finally, allowing
credits to be bought with real money would convert play money into consumer purchases by minors.

### Decision

1. **Append-only double-entry journal.** Every debit and credit is an immutable entry with an
   idempotency key; account balances are derived by aggregation, never written. Corrections are
   compensating entries, never edits.
2. **Exact arithmetic.** `rust_decimal` (or integer minor units) only. No floats anywhere in the
   money path.
3. **Grants are capped, not spends.** The 30/day cap applies at grant time per account per UTC day,
   enforced server-side from real events. Mission completion is evaluated by the server; client claims
   are never trusted.
4. **The investment pool is isolated.** Proceeds land in a separate, bounded pool with its own spend
   ceiling, so compounding cannot buy unlimited compute. Market data must be licensed, delayed data
   is acceptable, and there is no IRL redemption, ever.
5. **No real money.** Credits cannot be purchased, gifted for cash, or redeemed for cash. Physical
   rewards are school-fulfilled prizes with a stock budget, not a storefront.
6. **Trades are value-banded and monitored**, with review thresholds for large transfers, and trade
   history visible to the school.
7. **Compute and AI metering write to the same journal**, so spend is one system with one audit trail,
   and budget circuit breakers become a ledger query.

### Consequences

- **Positive:** every dispute is reconstructable from immutable history; double-spend and race bugs are
  designed out; the daily cap and the budget breakers are the same mechanism; the economy can be
  re-tuned by config (`economics/CREDITS-MODEL.md` §6) without a migration.
- **Negative / accepted cost:** aggregation queries instead of a cached balance column (mitigate with
  periodic snapshots plus delta replay, and per-account serialisation on the journal head); more
  schema and more code than a `balance` integer.
- **Follow-up work:** new-account zero state, in-flight idempotency, snapshot/replay tooling, ledger
  invariant tests (sum of entries is zero per transaction), and load tests on the hot path before
  Phase 5.

### Alternatives considered

| Alternative | Why not |
|---|---|
| `balance` column updated in place | Races, no audit trail, disputes unresolvable, and computed balances are needed anyway for reporting |
| Blockchain / on-chain tokens | Solves nothing here, adds cost, latency and legal exposure; this is bookkeeping |
| No economy at all | Rejects a core part of the brief; the economy is also the mechanism that funds student compute |
| Allow credit purchases with real money | Turns minors into paying consumers, adds consumer-law and app-store obligations, and breaks the fairness the cap exists to protect |

### Compliance / safeguarding note

No money changes hands, so the gambling, consumer-credit and IAP exposure is avoided by construction.
Randomised-reward mechanics (loot boxes) are prohibited by policy regardless of price, and trade
monitoring doubles as a bullying and coercion detection surface for staff.
