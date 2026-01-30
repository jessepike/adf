---
type: "specification"
description: "Defines the two-phase review mechanism used across all ACM stages"
version: "1.0.0"
updated: "2026-01-30"
scope: "acm"
lifecycle: "reference"
location: "acm/ACM-REVIEW-SPEC.md"
---

# ACM Review Specification

## Purpose

Define the review mechanism that applies across all ACM stages. This spec owns the **how** of reviews — cycle rules, severity definitions, stop conditions, issue logging, and tool requirements. Stage-specific prompts own the **what** — review dimensions, files to read, and artifact-specific criteria.

---

## Two-Phase Model

Every stage that produces a reviewable artifact uses a two-phase review process:

| Phase | Name | Mechanism | Required? |
|-------|------|-----------|-----------|
| **Phase 1** | Internal Review | Ralph Loop plugin — automated self-review cycle | **Mandatory** for all stages |
| **Phase 2** | External Review | User-initiated — external models or fresh-perspective agents | **User-driven** — based on complexity and project type |

### Phase 1: Internal Review

An automated iterative review. The reviewing agent reads the artifact, finds issues, fixes them, and re-reviews until the artifact is clean.

**Tool requirement:** MUST use the Ralph Loop plugin (`/ralph-loop:ralph-loop`).

**Prompt assembly:** The Ralph Loop is invoked with the stage-specific review prompt from `acm/prompts/`. The prompt contains the review dimensions; this spec defines the mechanism the prompt operates within.

**Invocation pattern:**
```bash
/ralph-loop:ralph-loop "$(cat ~/code/_shared/acm/prompts/{stage-prompt}.md)" --max-iterations 10 --completion-promise "{STAGE_PROMISE}"
```

### Phase 2: External Review

A fresh-perspective review by external models or agents not involved in Phase 1. The user decides whether to run Phase 2 and how many reviewers to use.

**When to use Phase 2:**
- Complex or multi-component projects
- Commercial-scale projects
- Projects where the stakes of a missed issue are high
- When the user requests it

**When Phase 2 can be skipped:**
- Simple or low-complexity projects
- Internal-only artifacts
- When the user explicitly decides it's not needed

**The user always makes this call.** Agents do not decide to skip or include Phase 2 on their own.

---

## Cycle Rules

These rules apply to both Phase 1 and Phase 2.

### Minimum Cycles

- **Phase 1:** Minimum 2 review cycles. Always.
- **Phase 2:** Minimum 1 cycle per reviewer (if Phase 2 is conducted).

### Stop Conditions

After each review cycle, assess:

> "Did this cycle surface any Critical or High severity issues?"

- **If yes:** Fix issues, run another cycle.
- **If no (and minimum met):** Review phase is complete.

### Maximum Cycles

- **Hard maximum:** 10 cycles per phase.
- **Structural problem signal:** If past 4 cycles and still finding Critical issues, something is fundamentally wrong. Stop and flag for human input.
- **Stuck signal:** If the same issue persists for 3+ iterations, stop and flag for human input.

### Typical Ranges

| Project Complexity | Phase 1 (Internal) | Phase 2 (External) |
|--------------------|---------------------|---------------------|
| Simple / Artifact | 2-3 cycles | 1 round (if conducted) |
| Moderate / App (personal) | 2-4 cycles | 1-2 rounds |
| Complex / App (commercial) | 3-5 cycles | 2-3 rounds |
| Workflow | 2-4 cycles | 1-2 rounds |

---

## Severity Definitions

Used consistently across all stages and both phases.

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Must resolve. Blocks the next stage or is fundamentally flawed. | Fix before proceeding. |
| **High** | Should resolve. Significant gap or weakness. | Fix before proceeding. |
| **Low** | Minor. Polish, cosmetic, or implementation detail. | Log but do not spend cycles fixing. |

**The test for Critical/High:** "If this issue isn't fixed, will the project fail or be significantly worse?" If no, it's Low.

---

## Issue Logging

All issues are logged in the artifact's Issue Log section using this format:

| # | Issue | Source | Severity | Status | Resolution |
|---|-------|--------|----------|--------|------------|
| N | [description] | [source] | Critical/High/Low | Open/Resolved/Deferred | [resolution or -] |

### Source Attribution

| Source Value | Meaning |
|--------------|---------|
| `Ralph-Internal` | Phase 1 internal review (Discover) |
| `Ralph-Design` | Phase 1 internal review (Design) |
| `Ralph-Develop` | Phase 1 internal review (Develop) |
| `External-{Model}` | Phase 2 external review (e.g., `External-GPT4`, `External-Gemini`) |
| `External-{Lens}` | Phase 2 agent review with named perspective (e.g., `External-Pragmatic`) |
| `Human` | Human-identified issue |

### Phase Completion Entry

When a review phase completes, add a summary entry:

| # | Issue | Source | Severity | Status | Resolution |
|---|-------|--------|----------|--------|------------|
| N | Phase {1/2} review complete | {source} | - | Complete | {cycle count}: {issues found} Critical, {n} High resolved |

---

## YAGNI Enforcement

Every review — internal and external — MUST apply YAGNI rigorously:

- Only flag issues that **block or significantly harm** the next stage
- Do NOT suggest features, additions, or "nice to haves"
- Do NOT ask "what about X?" unless X is critical to stated goals
- If something is explicitly out of scope, respect that decision
- Do NOT backdoor scope expansion as "questions to consider"
- Low-impact issues should not consume review cycles

**Reviewers are not consultants.** Their job is to find problems, not generate ideas.

---

## Completion Behavior

### Phase 1 Completion

When Phase 1 stop conditions are met:

1. Update the artifact's frontmatter status to `internal-review-complete`
2. Increment the `review_cycle` count in frontmatter
3. Add phase completion entry to Issue Log
4. Output the stage-specific completion promise

**Completion promises by stage:**

| Stage | Promise |
|-------|---------|
| Discover | `INTERNAL_REVIEW_COMPLETE` |
| Design | `DESIGN_INTERNAL_REVIEW_COMPLETE` |
| Develop | `DEVELOP_INTERNAL_REVIEW_COMPLETE` |

### Phase 2 Completion

When Phase 2 stop conditions are met (or user decides to skip):

1. Update the artifact's frontmatter status to `complete`
2. Add phase completion entry to Issue Log
3. Log any Design/Develop questions forwarded to next stage
4. Update revision history

### External Feedback Processing

After receiving Phase 2 feedback:

1. **Filter aggressively** — Ignore suggestions that expand scope
2. Extract only issues that genuinely block the next stage
3. Log in artifact's Issue Log with source attribution
4. Cross-reference multiple reviewers — if only one flags it and it's not clearly blocking, it's probably not Critical/High
5. **Cross-reviewer consensus** — Issues flagged by multiple reviewers are weighted higher

---

## Stage-Specific Prompt Structure

Each stage has two prompts in `acm/prompts/`:

| Stage | Internal Prompt | External Prompt |
|-------|-----------------|-----------------|
| Discover | `ralph-review-prompt.md` | `external-review-prompt.md` |
| Design | `design-ralph-review-prompt.md` | `design-external-review-prompt.md` |
| Develop | `develop-ralph-review-prompt.md` | `develop-external-review-prompt.md` |

**Prompts reference this spec for mechanism.** They should NOT duplicate cycle rules, severity definitions, stop conditions, or YAGNI enforcement. They contain only:

- Stage context (what phase this is, what comes next)
- Files to read
- Review dimensions (what to check)
- Artifact to update
- Type-specific modules (App, Workflow, Artifact)
- Completion promise string

### Type-Specific Modules

Review prompts include optional modules based on project classification:

| Module | Applies When | Adds |
|--------|-------------|------|
| **Commercial** | `Scale: commercial` | Revenue/cost alignment, market assumptions |
| **Workflow** | `Type: Workflow` | Trigger gaps, failure modes, idempotency |
| **Artifact** | `Type: Artifact` | Source dependencies, format compliance |
| **App** | `Type: App` | Scalability fit, state management, error handling |

Modules are appended to the base prompt, not separate files.

---

## Relationship to Other Specs

| Spec | Relationship |
|------|-------------|
| ACM-STAGES-SPEC.md | Defines the stages; this spec defines the review mechanism within stages |
| ACM-BRIEF-SPEC.md | Defines the Brief artifact; this spec defines how Briefs are reviewed |
| ACM-ENVIRONMENT-SPEC.md | Validation primitive; reviews are one form of validation |

---

## Design Principles

- **Mechanism is universal** — same cycle rules, severity, stop conditions everywhere
- **Dimensions are specific** — what you check depends on what you're reviewing
- **Internal is mandatory, external is user-driven** — agents don't decide review depth
- **YAGNI is non-negotiable** — reviewers find problems, not opportunities
- **Tool is prescribed** — Ralph Loop plugin, not ad-hoc agent invocations
