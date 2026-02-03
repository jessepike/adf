---
type: "transition-prompt"
description: "Guidance for transitioning from Develop to Deliver stage"
from_stage: "develop"
to_stage: "deliver"
version: "1.0.0"
updated: "2026-02-03"
---

# Develop → Deliver Transition

## Prerequisites

Before transitioning from Develop to Deliver, verify:

- [ ] Implementation complete per design.md
- [ ] Tests passing (if applicable)
- [ ] Documentation complete for deliverable
- [ ] All development work committed
- [ ] No critical or high issues open from review

---

## Artifact Cleanup Checklist

### Deliverables (Keep Active)
These artifacts carry forward to Deliver:
- `intent.md` — North Star reference
- `brief.md` — Scope and criteria
- `design.md` — Architecture reference
- Implementation artifacts (`src/`, `output/`, `workflows/`)
- Tests (if applicable)
- Documentation (README, user guides)
- `status.md` — Updated with handoff

### Working Artifacts (Archive)
Move these to `_archive/` with naming `_archive/YYYY-MM-DD-<name>.md`:
- Planning documents from `docs/adf/` (plan.md, tasks.md, manifest.md)
- Development notes
- Implementation spike reports
- Debugging logs
- Draft documentation versions

**Action:** Execute cleanup before updating status.md. Archive entire `docs/adf/` directory if planning artifacts are no longer needed.

---

## Status Update Requirements

Update `status.md` with:

1. **What was produced**
   - Summary of implementation
   - Key files/modules created
   - Test coverage (if applicable)

2. **What was archived**
   - List of archived artifacts (especially `docs/adf/` contents)
   - Rationale for each

3. **Success criteria status**
   - Reference brief.md criteria
   - Implementation alignment with design

4. **Known limitations**
   - Technical debt identified
   - Features deferred
   - Known issues

5. **Read order for Deliver stage**
   - `intent.md` first (reference)
   - `brief.md` second (criteria)
   - `design.md` third (architecture)
   - Implementation artifacts (what was built)
   - `status.md` for context

---

## Commit and Close

1. Archive working artifacts to `_archive/`
2. Update `status.md` with handoff block
3. Commit: `chore(develop): stage complete — {summary}`
4. Run `/clear`

---

## Deliver Stage Entry

The Deliver stage agent should:
1. Read `CLAUDE.md` → `status.md` → implementation artifacts
2. Understand what was built and how to deploy it
3. Prepare deployment/distribution artifacts
4. Begin delivery with clear context
