# ADR-0005 — Channel-tiered privacy: disclosed monitoring, no E2EE for under-16s

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** product, engineering, sponsor, counsel (pending review)
- **Affects:** `knoxus-api`, `knoxus-moderation`, chat schema, retention, voice

### Context

The brief contains two mutually exclusive proposals. Proposal A: the school monitors all chats,
teachers monitor some, AI replies on the teacher's behalf, parents may be contacted, and students get
"no privacy". Proposal B: end-to-end encrypted chats that teachers cannot read, with AI acting as a
regulator for NSFW material, slurs and drug references, including across multiple messages.

Proposal B is not implementable as described. Server-side detection across multiple messages requires
plaintext; client-side detection is defeated by a modified client within an hour. Claiming E2EE while
also promising detection produces the worst outcome available: a strong privacy claim the platform
cannot honour, matched with a safety claim it cannot deliver, in a service used by children.

Separately, covert monitoring of minors is both an ethical and a legal hazard: children hold privacy
rights, and a service that watches them without telling them is exposed in a way a transparent one is
not.

### Decision

**Privacy is tiered by channel, not by platform**, and monitoring is never covert. Every channel
carries an explicit visibility class, surfaced in the UI as a persistent banner.

| Class | Example | Readable by | AI | Retention |
|---|---|---|---|---|
| `Public` | School notice, community channel | All members of scope | Prompt-pack replies, labelled | Normal |
| `Supervised` | Staff↔student, staff↔parent | Participants, school admins; guardian on request | Disclosed assistant only | Safeguarding record |
| `Private` | Peer DM, private community | Participants **and** server-side classifiers; human review requires **dual control + logged justification** | Auto-escalation to a human on harm signals | Bounded, then purged |
| `Escalation` | Safety triage | Human counsellor only | Triage, never autonomous action | Safeguarding record |

Supporting invariants:

1. **No covert monitoring.** Students are told which channels are visible to staff, in the channel
   itself. This is the difference between lawful oversight and surveillance.
2. **No 1:1 adult↔minor voice/video** channel. Voice requires a public/community context with at
   least one other participant present.
3. **No voice or video recording**, at all, by anyone, including teachers. In NSW, recording a private
   conversation without consent is an offence; a minor cannot validly consent to their own
   surveillance on a guardian's behalf.
4. **Staff access to `Private` content** is exceptional, requires a second approver and a logged
   reason, and notifies the student that a review occurred (notification may be deferred only where
   a named safeguarding lead authorises it in writing).
5. **AI never acts alone**: no autonomous suspension, no autonomous reporting, no autonomous contact
   with a student or guardian. AI produces a signal; a named human acts.
6. **True E2EE is offered only to 16+ / alumni accounts**, where the promise can be honoured, and is
   never used for channels the school has a duty to oversee.

### Consequences

- **Positive:** implementable, honest, and defensible to guardians and to a regulator; the AI-reply
  and multi-message-detection features become possible at all; the notification guarantee turns an
  invisible capability into a documented policy.
- **Negative / accepted cost:** students who want genuine privacy will not get it here while under 16,
  which will be unpopular and must be communicated by the school, not discovered by students.
  Dual-control review adds friction and needs a roster of approvers.
- **Follow-up work:** visibility class in the schema and in every API response; banner component;
  dual-control review UI and audit trail; retention jobs; escalation routing to a named human with an
  SLA; guardian consent flow; notification-on-review mechanism.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Proposal B as written (E2EE + server-side detection) | Technically incoherent; detection cannot work on ciphertext without defeating the purpose |
| E2EE with client-side only detection | Trivially bypassed by a modified client; creates a false safety claim |
| Covert full monitoring of all channels | Legally and ethically exposed with minors; destroys the product's credibility the moment it is discovered |
| No monitoring at all | Incompatible with the school's safeguarding duties and mandatory reporting obligations |

### Compliance / safeguarding note

This ADR is the central compliance artefact and **requires written review by counsel and the school's
safeguarding lead before Phase 3 begins**. Questions for counsel are itemised in
[../compliance/DPIA.md](../compliance/DPIA.md) §9. Owner: safeguarding lead, with engineering
maintaining the enforcement mechanisms.
