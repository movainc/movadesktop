# ADR-0004 — School-issued identities, multi-tenant schema, tenant-scoped handles

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering, sponsor
- **Affects:** `knoxus-auth`, `knoxus-db`, all tenant-scoped tables, profile handles

### Context

The brief asks for a single-school product that can expand to multiple schools ("if seeking"), with
handles like `@jexample30(_school-name for expansion)`. Australian under-16 social media rules reward
identity-bound, non-anonymous services and punish open signup. The credits economy is also only
sustainable if each student has exactly one account — otherwise the 30-credit daily cap is trivially
multiplied by alt accounts, and the compute budget with it.

### Decision

1. **Identity comes from the school.** No self-service signup, no password storage for students, no
   external/unaffiliated accounts. Authentication is OIDC/SAML against the school's identity provider;
   the platform asserts roles (student, teacher, parent, staff, admin) from provisioned claims.
2. **Every tenant-scoped table carries `tenant_id NOT NULL`** with composite foreign keys so a row
   cannot join across tenants by accident. Repository functions require a `TenantContext`, and no
   query executes without one.
3. **Handles are tenant-scoped**: `@jexample30_knox`, unique per tenant, immutable, cosmetically
   changeable display name. The suffix is the entire multi-school expansion strategy.
4. **One human, one account.** Duplicate-identity heuristics (device, guardian contact, enrolment
   ID) raise a review flag; there is no mechanism to create a second account with credits attached.

### Consequences

- **Positive:** credible anti-abuse foundation for credits and compute; strong compliance posture for
  a minors' service; zero student credential storage; onboarding is the school's existing process.
- **Negative / accepted cost:** the platform cannot be used by anyone outside the school; parent and
  alumni accounts need their own provisioning path; SSO outages become product outages (mitigated
  by session refresh and a documented break-glass admin path — logged, time-boxed, dual-control).
- **Follow-up work:** tenancy guard tests (attempt cross-tenant reads in CI), break-glass runbook,
  and a role-provisioning contract agreed with school IT.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Email/password signup with school domain filter | Domain filters are bypassed by alumni and forwarding; no enrolment truth; invites phishing |
| Google/Apple social login | Identity unrelated to enrolment; no role claims; conflicts with the under-16 posture |
| Single-tenant schema, "add schools later" | A tenant column cannot be retrofitted safely once data exists in production |
| Global unique handles | Guaranteed collisions across schools; forces an ugly migration later |

### Compliance / safeguarding note

Eating the "no strangers on the platform" property is the single highest-value safety control in the
product: it eliminates the entire stranger-contact abuse class, and it gives guardians and the school
a verifiable membership list. Advisory visibility of an identity is also what makes a mandatory
reporting escalation actionable.
