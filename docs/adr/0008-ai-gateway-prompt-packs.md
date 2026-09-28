# ADR-0008 — AI behind a gateway with versioned prompt packs and mandatory disclosure

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** engineering, product, counsel (pending review)
- **Affects:** `knoxus-ai`, chat, moderation, translations, video generation, profile checks

### Context

The brief specifies AI replies driven by teacher-authored prompts, built-in prompt packs ("similar to
AGENTS.md"), a named model ("DeepSeek v4.1 Flash") with changeable reasoning and short/long response
modes, plus translation, moderation and media generation. The named model cannot be verified from
this repository, and sending minors' messages — including anything a classifier flags — to a
third-party model provider raises cross-border disclosure and children's-data obligations. Teachers
authoring prompts directly is also a content-safety surface: prompts will be tested, abused, or
accidentally misconfigured.

### Decision

1. **A single AI gateway** owns every model call. No service calls a provider directly. The gateway
   handles routing, retries, timeouts, cost metering into the ledger, rate limits, redaction of
   obvious identifiers, and audit logging.
2. **Provider registry, tenant policy.** Models are entries in a registry, not constants: provider,
   region, context window, cost, capability flags. Each tenant selects an allowed set; the default is
   an in-region provider with a contractual no-training guarantee and a signed DPA.
3. **Versioned prompt packs.** Prompts live in the repository, are semver-versioned, per-tenant
   overridable, and pass a lint (no PII requests, no impersonation, no medical/legal/crisis advice,
   no unfiltered output) plus an eval suite of golden transcripts and jailbreak tests before they can
   be activated. A prompt pack is identified by version and hash in every audit entry.
4. **Mandatory disclosure.** Every AI-generated message, translation and media item carries a visible
   badge and machine-readable metadata (`ai_generated`, model, prompt-pack version, hash).
5. **Reasoning effort and response length are configuration**, per tenant, with sane defaults for the
   response verbosity the school wants in each channel.
6. **AI never acts autonomously** on a student: no autonomous contact, suspension, or reporting. It
   raises signals to a named human ([ADR-0005](0005-chat-privacy-tiering.md), channel 6).
7. **Kill switch per tenant and per feature**, operable without a deploy.

### Consequences

- **Positive:** provider changes (model deprecation, pricing, legal changes) become registry edits;
  cost is metered per call; every output is attributable to a prompt pack version for incident review.
- **Negative / accepted cost:** an extra hop and a maintainable abstraction; the eval suite is real
  ongoing work that will be resisted when deadlines bite — so it is a CI gate, not a suggestion.
- **Follow-up work:** registry schema, gateway with per-tenant policy, prompt lint and eval harness,
  disclosure component and metadata, kill switch, cost dashboards by feature.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Call the named model directly from services | Provider lock-in; no metering; no per-tenant control; a single deprecation breaks features |
| Let teachers edit live prompts with no lint or evals | Prompt injection and unsafe outputs become a safeguarding incident with a teacher's name attached |
| Silently generated AI content | Dishonest, and removes the cheapest trust mechanism in the product |
| Self-hosted open-weights only | Slower to iterate and more ops burden early; keep as a registry option when GPU capacity exists |

### Compliance / safeguarding note

Requires counsel review for cross-border transfer, retention by the provider, and the children's-data
posture before any provider is enabled for student content. Owner: engineering, with counsel sign-off
per provider added to the registry.
