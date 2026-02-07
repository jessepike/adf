---
name: Ecosystem Alignment
description: This skill should be used when the user asks to "check ecosystem alignment", "audit cross-project consistency", "validate ecosystem", "check integration points", or wants to verify that interrelated projects are staying aligned with the ecosystem architecture and each other's interface contracts.
version: 0.1.0
---

# Ecosystem Alignment Skill

Validates that interrelated projects in the ecosystem remain aligned with the governing ecosystem architecture, each other's interface contracts, and their own stated intents.

## Purpose

Individual projects have their own validation (adf-env audit, spec compliance, health checks). This skill operates at the **seams between projects** — catching drift that no single project's validation would detect.

## When to Use

- Before starting work on a project that has cross-project integration points
- After making significant changes to briefs, specs, or architecture documents
- Periodically (e.g., monthly) as a health check across the ecosystem
- When adding a new system to the ecosystem
- When changing an interface contract (API shape, entity model, connector format)

## Governing Document

**`docs/ecosystem-architecture.md`** is the source of truth for how systems relate. All alignment checks reference it. If the ecosystem architecture doc doesn't exist or is stale, flag that as the first finding.

## Data Sources

| Source | What to Read | How to Access |
|--------|-------------|---------------|
| Ecosystem architecture | `docs/ecosystem-architecture.md` | Direct file read |
| ADF specs | `ADF-*-SPEC.md` | ADF MCP: `get_artifact_spec()` |
| Project briefs | `docs/inbox/*.md` (or per-project brief.md) | Direct file read |
| Project status files | `status.md` in each repo | Direct file read |
| CLAUDE.md files | `.claude/CLAUDE.md` and root `CLAUDE.md` per repo | Direct file read |
| KB entries | Architecture and integration topics | KB MCP: `search_knowledge()` |
| ADF intent | `docs/intent.md` | Direct file read |
| Capabilities registry | `INVENTORY.md` or `inventory.json` | Direct file read or ADF MCP: `query_capabilities()` |

## Audit Procedure

Run checks in order. Each check produces findings rated: **Aligned**, **Drift** (deviation from intent), or **Gap** (missing coverage).

### Check 1: Governing Documents Exist and Are Current

Read the ecosystem architecture doc and project briefs. Verify:
- [ ] `docs/ecosystem-architecture.md` exists and has been updated within 30 days
- [ ] Each system listed in the System Map has a corresponding brief or spec
- [ ] Build status in the doc matches actual state (check for repos that now exist, artifacts that have been created)
- [ ] No systems exist in the codebase that are missing from the ecosystem map

**How:** Read ecosystem-architecture.md, then check each listed location exists. Cross-reference with actual directory listing of `~/code/_shared/`.

### Check 2: Interface Contract Consistency

For each integration point listed in the Integration Map, verify the contracts match on both sides.

**ADF ↔ Work OS contract:**
- [ ] ADF specs for status.md, tasks.md, backlog.md match what Work OS brief says the ADF connector will parse
- [ ] Field names, required sections, and formats are consistent between ADF specs and Work OS entity model
- [ ] Any changes to ADF artifact specs since the Work OS brief was written are flagged

**Work OS ↔ Krypton contract:**
- [ ] Work OS MCP tool surface matches what Krypton brief lists as Work OS skill capabilities
- [ ] Entity shapes (Project, Task, BacklogItem) are consistent between both briefs
- [ ] Digest format in Work OS matches what Krypton expects to deliver

**KB ↔ Ecosystem:**
- [ ] KB content types (learning, idea, note) align with how consumers (ADF agents, Krypton) expect to query
- [ ] No KB entries contradict architecture decisions in briefs

**Memory ↔ Ecosystem:**
- [ ] Memory scoping model (if designed) aligns with how ADF agents and Krypton plan to read/write
- [ ] Memory vs KB boundary is clear and consistently described across documents

**How:** Read both sides of each contract. Compare field names, entity shapes, tool names, and expected behaviors. Flag any mismatch.

### Check 3: Dependency Chain Health

Verify nothing is being built out of order or blocked unnecessarily.

- [ ] Critical path items are progressing (Work OS → Krypton)
- [ ] Parallel work items (Memory Layer) are not accidentally blocking critical path
- [ ] No project has started building something that depends on an unbuilt system
- [ ] Status files across repos reflect accurate current state

**How:** Read status.md from each repo. Cross-reference with dependency chain in ecosystem architecture. Flag any project that references capabilities from an unbuilt system.

### Check 4: Terminology Consistency

Verify the same concepts use the same names across all projects.

Key terms to check across all briefs, specs, and architecture docs:
- Project / Task / BacklogItem / Phase (entity names)
- Connector / Adapter / Skill (integration concepts)
- Scope / Namespace / Visibility (access control concepts)
- Memory / Knowledge / Context (knowledge layer concepts)
- Stage / Phase / Step (process concepts)

- [ ] No term collisions (same word, different meaning across projects)
- [ ] No concept splits (same thing called different names in different projects)

**How:** Grep key terms across all briefs and specs. Flag inconsistencies.

### Check 5: Intent Alignment

Verify that each project still serves its stated purpose and the ecosystem's overall intent.

- [ ] Each project's brief aligns with its role in the ecosystem architecture
- [ ] ADF intent (`docs/intent.md`) is not contradicted by any project's direction
- [ ] No scope creep — projects haven't absorbed responsibilities that belong to another system
- [ ] Boundary definitions are clear (what Work OS is NOT, what Krypton is NOT, what ADF is NOT)

**How:** Read each project's "What this is NOT" section (if present). Cross-reference responsibilities across briefs. Flag any overlap or contradiction.

### Check 6: Open Decisions Cross-Check

Verify that open decisions in one project don't conflict with decisions (open or resolved) in another.

- [ ] Collect open decisions from all briefs
- [ ] Check for contradictions (e.g., Work OS says "strict ADF parsing" but ADF spec allows flexibility)
- [ ] Check for dependencies (e.g., Krypton decision on gateway language may constrain Work OS MCP adapter)
- [ ] Flag decisions that have been implicitly resolved by implementation but not updated in briefs

**How:** Read open decisions sections from all briefs. Cross-reference.

## Output Format

Produce a structured alignment report:

```markdown
# Ecosystem Alignment Report
**Date:** YYYY-MM-DD
**Scope:** [full / targeted]

## Summary
- X checks run
- Y aligned, Z drift findings, W gaps

## Findings

### [Check Name]
**Status:** Aligned | Drift | Gap

**Details:**
- [specific finding]
- [specific finding]

**Recommendation:** [what to do about it]

## Action Items
- [ ] [concrete next step]
- [ ] [concrete next step]
```

## What This Skill Does NOT Do

- Does not modify any artifacts (audit only — findings and recommendations)
- Does not validate individual project health (that's adf-env's job)
- Does not enforce — it surfaces. Humans decide what to act on.
- Does not replace project-level reviews (adf-review handles those)

## Relationship to Other Skills

| Skill | Scope | Relationship |
|-------|-------|-------------|
| **adf-env audit** | Single project environment baseline | Complementary — adf-env checks one project, this checks across projects |
| **adf-review** | Single artifact quality | Complementary — adf-review validates artifact quality, this validates cross-project consistency |
| **adf-workflow** | Stage navigation within a project | Independent — different concern entirely |
| **ecosystem-alignment** (this) | Cross-project seams and contracts | Unique — nothing else covers this |
