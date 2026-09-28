# Threat model — Knoxus

Status: **draft for review.** Method: asset-led, STRIDE-assisted, with an abuse-case register that is
maintained as a test suite (§7). This document is a living artefact: every incident adds a case.

Related: [../PLAN.md](../PLAN.md) · [../adr/0005-chat-privacy-tiering.md](../adr/0005-chat-privacy-tiering.md) · [../compliance/DPIA.md](../compliance/DPIA.md)

---

## 1. Scope

In scope: the web/PWA client, the desktop shell, the Rust back-end, chat and voice, the media
pipeline, the AI gateway, the credits ledger, the compute control plane, the CLI, and the `knoxi!`
connector. Out of scope for this revision: the school's own identity provider and network, and the
third parties' internal systems (their guarantees are tracked as dependencies, not threats).

The distinguishing property of this system: **the users are children, the operator is their school,
and the platform's most sensitive capability is its ability to reveal what children say to each
other.** Almost every high-severity threat below is a variation on that theme.

## 2. Assets

| # | Asset | Why it matters |
|---|---|---|
| A1 | Peer-chat content | Disclosed to staff only under policy; leakage destroys trust and can endanger a student |
| A2 | Staff↔student and staff↔parent records | Safeguarding evidence; retention obligations |
| A3 | Student identity & enrolment data | Minors' personal information; identity theft and doxxing |
| A4 | Guardian contact details | Direct route into a family |
| A5 | Moderation signals & reports | Reveal who reported whom; retaliation risk |
| A6 | AI prompts, packs & outputs | Prompt injection, unsafe output at scale |
| A7 | Credits ledger & inventory | Fraud, laundering, coercion, bullying leverage |
| A8 | Student compute & hosted content | Illegal content hosting, abuse of the school's name and network |
| A9 | Audit log | The evidence that oversight was lawful and minimal |
| A10 | Authentication & session state | Account takeover of a minor, impersonation of staff |
| A11 | Voice/screen-share sessions | Live exposure; unrecordable by policy |
| A12 | Tenant-subdomain and DNS zone | Takeover, phishing under the school's domain |

## 3. Actors

| Actor | Capability | Motivation |
|---|---|---|
| Curious student | Full client access, can modify the client | Curiosity, status, "can I get around it" |
| Malicious student | Scripts, proxies, alt-account attempts | Harm a peer, evade moderation, free compute |
| Predatory adult inside the school | Staff access, legitimacy | Grooming, coercion |
| Predatory adult outside | No account; may obtain one via a student | Contact with minors |
| Misusing staff member | Supervisory access | Curiosity about a student's chats |
| External attacker | Internet-facing surface | Data theft, extortion, vandalism |
| Well-intentioned-but-wrong staff | Config/prompt access | Poor AI config, over-broad visibility request |
| Third-party provider | Processes content | Retention/training misuse; breach |
| School IT | Infrastructure access | Pragmatic shortcuts that break privacy guarantees |

## 4. Trust boundaries

| # | Boundary | Assumption | Enforcement |
|---|---|---|---|
| B1 | Untrusted student device / client ↔ API | The client is hostile; it can be modified, and it will lie | All authorisation, moderation and metering re-evaluated server-side; no client-side trust |
| B2 | Browser frame ↔ third-party iframe | Embeds are hostile by default | `sandbox`, strict CSP, allowlisted domains, no shared cookies/storage |
| B3 | Platform ↔ third-party AI/media/telephony | Provider sees whatever we send | Redaction, minimum-necessary content, DPA + no-training terms, per-tenant policy |
| B4 | Student workload ↔ platform services | The workload is hostile and may be illegal | Network deny-by-default, no path to platform services or the platform database |
| B5 | Staff user ↔ peer-chat content | Legitimate need is narrow and must be evidenced | Dual control, logged justification, notification, review audit |
| B6 | School IT ↔ production access | Needs infrastructure access without reading content | Infrastructure creds cannot decrypt or query message bodies; content reads go through the audited app path |
| B7 | Tenant ↔ tenant | Schools are separate trust domains | `tenant_id` on every row, composite keys, tenancy guard tests in CI |
| B8 | `knoxi!` ↔ platform | Source system is authoritative but not public | Read-only adapter, provenance, review-before-publish, no write-back |

## 5. STRIDE pass (abbreviated)

| Category | Threat | Control |
|---|---|---|
| Spoofing | Student impersonates staff; adult impersonates a student | SSO-only identity, per-role claim mapping, no impersonation feature, staff actions re-authenticated for sensitive operations |
| Spoofing | AI output presented as a person | Mandatory disclosure metadata + visible badge; no AI avatar of a real person |
| Tampering | Ledger tampering; mission claims | Append-only journal, server-side mission evaluation, idempotency keys |
| Tampering | Prompt pack edited to remove guardrails | Versioning + lint + evals + kill switch; activation is a reviewed change |
| Repudiation | Staff denies viewing a chat | Mandatory audit entry with actor, reason, approver, timestamp; entries immutable |
| Information disclosure | Peer-chat leakage to staff, other students or vendors | Channel visibility classes; dual control; redaction before AI; no analytics SDKs; encryption at rest with key separation |
| Information disclosure | Cross-tenant leakage | Tenancy guard tests; composite FKs; no cross-tenant joins |
| Information disclosure | Moderation signals reveal reporters | Reporter identity visible only to the safeguarding lead; never in community-visible outcomes |
| Denial of service | Student compute exhausts shared capacity; budget exhaustion | Quotas, pre-emptible instances, per-student and school-wide circuit breakers, backpressure on chat fan-out |
| Elevation of privilege | Container escape from student workload | Sandboxed runtimes (microVM/gVisor class), no sudo, read-only base, seccomp, no host mounts |
| Elevation of privilege | SSRF via link preview / iframe / connector | Metadata fetch through a hardened resolver, allowlist, no access to link-local or internal ranges |
| Elevation of privilege | Stored XSS via profile cosmetics/fonts | Vetted asset catalogue, no raw CSS/SVG, strict CSP, sanitised rich text everywhere |

## 6. Abuse-case register

Ordered by severity. Each case becomes an automated or scripted test in §7.

| # | Case | Path | Impact | Controls | Detection |
|---|---|---|---|---|---|
| AC-01 | Grooming via peer DM or 1:1 channel | Adult or older student escalates intimacy over time | Severe | No 1:1 adult↔minor voice; no strangers on-platform (ADR-0004); conversation-window classifiers; escalation to a named human; guardian visibility for staff channels | Multi-message signal scoring; velocity and time-of-day anomalies; age-gap pairing alerts |
| AC-02 | Staff member reads a student's private chats out of curiosity | Legitimate access misused | Severe (trust, legal) | Dual control, reason codes, student notification, immutable audit | Access-pattern review; quarterly audit review of approvals |
| AC-03 | CSAM uploaded or hosted (media upload or student compute) | Upload path or hosting tier | Severe (illegal) | Hash-match detection with escalation; compute egress restrictions and AUP; takedown SLA; no staff viewing | Vendor hash alerts; abuse reports; hosting content signals |
| AC-04 | Non-consensual intimate imagery / deepfake of a student | Upload or AI video generation using a likeness | Severe | Consent registry for likeness use; clip quotas; provenance metadata; pre-publish moderation; takedown path | Likeness-match detection; report flow; generation audit linked to a student account |
| AC-05 | Self-harm or suicide-risk disclosure | Any channel | Severe | Auto-escalation to a human on signal; crisis resources; no autonomous AI response; on-call roster | Classifier + pattern detection; escalation SLA monitoring |
| AC-06 | Drug/vape solicitation and coordination | Peer DM or private community | High | Multi-message detection; escalation to a human; private communities remain server-visible (ADR-0005) | Signal scoring; report flow; community-level anomaly detection |
| AC-07 | Bullying, exclusion and pile-ons | Communities, comments, reactions | High | No public like/follower counts; private reactions; report + block; community moderation duties | Report clustering; message-velocity spikes; repeated-target heuristics |
| AC-08 | Coerced trading / credits extortion | Ledger, trades | High | Value bands, review thresholds, trade history visible to the school, item-only gifting | Ledger anomaly detection; trade-pattern review |
| AC-09 | Alt-account farming to multiply compute | Signup or identity reuse | Medium-high (cost) | SSO-bound single identity; device correlation; grant cap per account per day | Duplicate-identity flags; correlated device signals |
| AC-10 | Prompts jailbroken to produce unsafe output at scale | Teacher prompt packs | High | Prompt lint + eval suite + jailbreak tests as CI gates; per-tenant kill switch; disclosure labelling | Eval failures block activation; output sampling; incident review |
| AC-11 | Prompt injection via user content (message or uploaded doc) | Content reaching the AI gateway | Medium-high | Treat all user content as untrusted data, never instructions; tool/function allowlist; no autonomous actions | Injection-canary tests in the eval suite |
| AC-12 | Student compute used to host phishing or a proxy | Hosting tier | High (school's reputation, network) | Egress allowlist, no persistent outbound, isolation, abuse detection, kill switch | Egress anomaly detection; external abuse reports; CPU/mining patterns |
| AC-13 | Stored XSS via profile cosmetics, fonts or rich text | Profile editing | High | Vetted asset catalogue, no raw CSS/SVG, sanitised rich text, strict CSP | CSP violation reporting; upload scanning |
| AC-14 | SSRF via link preview, iframe builder or the `knoxi!` connector | Metadata fetch paths | High | Hardened resolver, allowlist, no link-local/internal ranges, response size and type limits | Outbound request logging; allowlist denials |
| AC-15 | Tenant-subdomain takeover / phishing under `*.knoxus.au` | DNS and cert issuance | High | Reserved names, ownership verification before issuance, automated ACME, monitors on DNS records | Certificate transparency monitoring; DNS drift alerts |
| AC-16 | Enrolment data exfiltration by an insider or external attacker | API, DB, exports | Severe | Least privilege, tenancy guards, encryption at rest with key separation, export audit, no bulk export without dual control | Anomalous query volume alerts; export audit review |
| AC-17 | Parent monitors a peer chat beyond consent | Guardian visibility feature | Medium | Student opt-in required for peer-chat oversight; guardians see staff channels by default only | Consent-state enforcement; access audit |
| AC-18 | Voice session recorded by a participant | Any VC | High (illegal in some cases) | Platform does not record and does not provide recording; clear on-screen state; terms + reporting path | Impossible to detect platform-side — treat as a physical/behavioural risk, handle via policy |

## 7. Red-team suite (CI, from Phase 1)

Scripted attempts that must all fail. Booking them as tests is the only way these guarantees survive
contact with deadlines.

| Test | Must observe |
|---|---|
| Cross-tenant read of any resource | 404/403, and a tenancy violation logged |
| Student fetches a `Private` message they are not a participant of | 403, no partial payload, audit entry |
| Staff reads `Private` content without a second approver | 403, attempt recorded |
| Modified client submits an unmoderated post / fake mission completion / forged credit grant | Rejected server-side; grant evaluated from real events only |
| Client sets its own `tenant_id`, role, or visibility class | Ignored; server derives from the session |
| Student workload attempts egress to the internet, to platform services, to the cloud metadata endpoint | Denied and alerted |
| Student workload attempts to disable its idle watchdog or exceed its quota | Denied by the control plane; instance terminated |
| Link preview / iframe / connector pointed at internal or link-local addresses | Blocked by resolver |
| Profile cosmetics attempt CSS/SVG/attribute injection | Sanitised; CSP violation reported |
| Prompt pack containing injection payload or unsafe instruction attempts activation | Blocked by lint/eval; not activatable |
| Invite link reused, expired, or used from another tenant | Rejected |
| Video generation requested with an unconsented likeness | Blocked, request audited |
| Ledger: double-spend, negative balance, concurrent spends on one account | One succeeds, one fails with a clear error; journal remains balanced |
| Session replay after logout / token theft simulation | Session invalidated; refresh rotation detected |

## 8. Controls summary

**Preventive:** SSO-only identity · least-privilege roles · channel visibility classes · dual control ·
pre-publish moderation · prompt lint and evals · network deny-by-default for workloads · vetted asset
catalogue · strict CSP · consent registry for likeness · budgets and quotas.

**Detective:** conversation-window classifiers · escalation SLA monitoring · audit review of content
access · ledger anomaly detection · egress and CPU anomaly detection · certificate transparency
monitoring · report clustering.

**Corrective:** takedown and suspension flows with a documented SLA · kill switches (AI per tenant,
compute globally) · incident response runbook with named owners · notification templates for
students, guardians and the school.

**Observability promise:** enough telemetry to prove oversight was minimal and logged, and **no**
third-party analytics or ad SDKs on any student surface.

## 9. Residual and accepted risks

| Risk | Why accepted | Mitigation |
|---|---|---|
| A participant records a voice session with their own software | The platform cannot prevent client-side capture | Clear UI state, terms, reporting path, school policy |
| A determined student routes around moderation via an external app | Out of platform control | The product is a *replacement*, not a cage; measure adoption, not enforcement |
| False positives and false negatives in classifiers | Statistical systems are imperfect | Human-in-the-loop for every consequential action; tune thresholds with pilot data; never punish on AI alone |
| Staff-time cost of dual-control reviews | Real operational load | Narrow the population of approvers; make reasons one tap; review the policy quarterly |
| SSO outage takes the platform offline | Deliberate trade for anti-abuse and safety | Documented break-glass path, logged and time-boxed |
| Student compute carries irreducible abuse risk | Any hosting does | Keep it last, gated, egress-restricted, and budget-capped (ADR-0009) |

## 10. Maintenance

- Every incident and every near-miss adds an abuse case here and a test in §7.
- Reviewed at each phase gate, and whenever a new third party, channel class, or AI capability is
  added — those three changes are the ones that historically invalidate a threat model.
- This document and [../compliance/DPIA.md](../compliance/DPIA.md) are read together: the threat model
  says what can go wrong, the DPIA says why the processing is justified anyway.
