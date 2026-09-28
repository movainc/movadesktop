# DPIA skeleton — Knoxus

Status: **skeleton, incomplete by design.** This is the structure to be filled in with counsel and the
school's safeguarding lead. Sections marked *(fill)* are placeholders; §9 is the actual deliverable
from engineering to counsel in this revision.

Related: [../PLAN.md](../PLAN.md) §8 · [../adr/0005-chat-privacy-tiering.md](../adr/0005-chat-privacy-tiering.md) · [../threat-model/THREAT-MODEL.md](../threat-model/THREAT-MODEL.md)

---

## 1. Purpose of this DPIA

Knoxus processes personal information of children, including content of communications, with a
capability for staff oversight. A DPIA is required because the processing is high-risk by nature
(children, large scale relative to the population, monitoring, and AI-generated content). It must be
completed **before** Phase 3 (chat) begins, not before final launch.

## 2. Roles and responsibilities

| Role | Party | Notes |
|---|---|---|
| Data controller / APP entity | The school (or the school system) | *(confirm)* |
| Platform operator | *(fill — school IT, a vendor, or the project team)* | Determines access controls |
| Processor(s) | LLM, telephony, media, CSAM, hosting vendors | List per §10 |
| Approval | Principal + safeguarding lead + *(fill)* | Written sanction is a Phase 0 gate |

## 3. Data map

| Data | Subject | Source | Purpose | Retention | Sensitivity |
|---|---|---|---|---|---|
| Identity, year group, roles | Students, staff | School identity provider | Function of the service | Until exit + *(fill)* | Personal |
| Guardian contact details | Parents | School records | Contact, consent, oversight | *(fill)* | Personal |
| Posts, comments, reactions | All | Users | Communication | *(fill)* | Personal |
| Chat messages (by channel class) | Users | Users | Communication + oversight | Per class, see §7 | Sensitive in context |
| Moderation signals and reports | Users | Platform + users | Safety | *(fill)* | Sensitive; revealing |
| Safeguarding records | Students | Staff | Duty of care, mandatory reporting | Long-term; per records authority | Highly sensitive |
| Media (highlights, VCs metadata) | Users | Users | Communication | *(fill)* | Personal; VOICE NOT RECORDED |
| AI prompt packs and outputs | Staff, students | Staff, platform | Assistance, moderation | *(fill)* | Personal in context |
| Ledger, trades, balances | Users | Platform | Economy | *(fill)* | Personal; behavioural |
| Compute projects and logs | Students | Students | Hosting | *(fill)* | Potentially illegal content |
| Audit log of staff access | Staff | Platform | Accountability | *(fill)* | Sensitive to staff |

## 4. Necessity and proportionality

*(fill)* The argument to make explicitly: oversight exists to meet the school's duty of care and
mandatory reporting obligations, is bounded to the minimum access that achieves that, is visible to
the students it covers, and is itself logged.

## 5. Monitoring justification (the contested part)

Answer these in writing before Phase 3:

1. Which channels are visible to whom, and why is each broader visibility necessary?
2. Why is dual control plus logged justification sufficient for `Private` channels?
3. What is the notification policy when a review occurs, and who can defer notification?
4. Why can staff not read everything, when the brief originally wanted that? (Answer: because
   minimum-necessary access is what makes the capability lawful and survivable.)

## 6. Consent model

*(fill)* Student assent + guardian consent for under-18s; the limits of guardian authority over a
child's privacy; alumni and 16+ E2EE tier where consent is individual; withdrawal handling; and how
consent is captured and evidenced per student (not per school).

## 7. Retention schedule *(fill)*

| Data class | Retention | Basis | Deletion mechanism |
|---|---|---|---|
| Account and enrolment data | Until exit + *(fill)* | *(fill)* | Hard delete job with audit |
| Public posts and highlights | *(fill)* | | Soft delete, then purge |
| Supervised channel records | *(fill)* — expect long | Duty of care, records authority | Immutable archive, restricted access |
| Private channel messages | *(fill)* — keep short | Minimum necessary | Automatic purge with evidence of purge |
| Moderation signals | *(fill)* | Safety trend analysis | Aggregated after *(fill)* |
| Safeguarding records | Long-term, per school records policy | Mandatory reporting evidence | Never auto-deleted; reviewed by the school |
| Audit log of staff access | *(fill)*, typically ≥ 2 years | Accountability | Append-only, exportable |
| Compute project artifacts | 30 days after project end | *(fill)* | Purge, then confirm |

The single most defensible policy here: **keep private-channel content for the shortest period that
satisfies safety needs, and keep records of *oversight* for longer than the content itself.**

## 8. Access control and audit

- Role-based access with per-channel visibility classes ([ADR-0005](../adr/0005-chat-privacy-tiering.md)).
- `Private` content reads require two approvers and a structured reason code (investigation, court
  order, safeguarding escalation, guardian request with student knowledge).
- Every read of another person's content writes an immutable audit entry: actor, subject, channel
  class, reason code, approver, timestamp, and the case reference.
- Student notification on review, unless a named safeguarding lead defers it in writing.
- Quarterly access review: who can approve, who approved, and what the reasons were.

## 9. Questions for counsel (the deliverable from engineering)

1. Does a school-authorised service of this shape fall inside or outside the "age-restricted social
   media platform" definition, including under the exclusion instrument (F2025L00889)? What design
   changes would strengthen the position?
2. Is transparent, disclosed monitoring of student chat lawful with guardian consent and student
   assent — and what are the limits of guardian authority over a child's communications?
3. Which state surveillance/device laws apply to voice sessions, screen share, and any form of
   recording, and does our no-recording invariant remove that exposure entirely?
4. What are the retention obligations for safeguarding records, and how do they interact with
   minimum-necessary storage of chat content?
5. Are platform staff "mandatory reporters", or must escalation always route to a school employee who
   is? What SLA is defensible?
6. Can we send student message content to an offshore LLM provider at all; if so, under what
   contractual and redaction conditions?
7. What are our obligations on discovering CSAM in a student's hosted content or uploads, and what
   must our detection-and-escalation path look like?
8. What must the guardian consent instrument say, and is per-student consent required?
9. Do the platform's economy mechanics (rewards, missions, monitored trades, market simulation)
   trigger any consumer, gambling, or financial-services regulation?
10. What insurance cover (cyber, professional indemnity) should the school hold before the compute
    tier ships?

## 10. Third-party processors *(fill)*

| Vendor | Role | Data sent | Location | Agreement status |
|---|---|---|---|---|
| LLM provider | AI replies, moderation assist | Redacted message content | *(fill)* | Not yet selected |
| Telephony | School-number calls | Numbers, call metadata | *(fill)* | Not yet selected |
| CSAM detection | Hash-match escalation | Media hashes/metadata | *(fill)* | Not yet selected |
| Media/CDN | Storage and delivery | Uploaded media | *(fill)* | Not yet selected |
| Compute back-end | Student hosting | Hosted content | *(fill)* | Not yet selected |

## 11. Risk register *(fill)*

Each row: risk, likelihood, impact, existing control, residual rating, owner, review date. Seed the
register from [../threat-model/THREAT-MODEL.md](../threat-model/THREAT-MODEL.md) §6 rather than
writing it from scratch.

## 12. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Principal / delegate | | | |
| Safeguarding lead | | | |
| Platform operator | | | |
| Counsel | | | |

**Review cadence:** at each phase gate, on any material change to monitoring or retention, and after
any safeguarding incident. This DPIA is not a one-off document.
