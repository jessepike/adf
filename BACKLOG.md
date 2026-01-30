---
type: "tracking"
description: "ACM backlog — improvements, enhancements, and future work"
version: "1.0.0"
updated: "2026-01-30"
scope: "acm"
lifecycle: "reference"
location: "acm/BACKLOG.md"
---

# ACM Backlog

## Active — High Priority

| ID | Item | Type | Component | Status |
|----|------|------|-----------|--------|
| B1 | Harden start-develop prompt — enforce STOP gate after planning phases | Prompt fix | ACM/prompts | Done |
| B2 | Extract capability registry from agent-harness → `~/code/_shared/capabilities-registry/` | Mini-project | capabilities-registry | Done ✅ |
| B3 | Phase boundary protocol — agent-driven `/clear` + re-read artifacts + confirm transition | Spec update | ACM-DEVELOP-SPEC | Done |
| B4 | Review scoring — diminishing returns detection (Critical/High/Low, min 2, max 10 cycles) | Spec + prompt | All stages | Done |
| B9 | Create REGISTRY-SPEC.md (types, tags taxonomy, capability.yaml schema, lifecycle) | Spec | capabilities-registry | Done ✅ (part of B2) |
| B10 | Wire acm-env → capabilities-registry (develop spec Phase 2 points to INVENTORY.md) | Spec + prompt | ACM + registry | Done ✅ |
| B11 | Inventory generation script (capability.yaml → inventory.json → INVENTORY.md) | Script | capabilities-registry | Done ✅ (part of B2) |
| B17 | Document environment layer architecture (six primitives, two layers) | Spec | ACM | Done (ACM-ENVIRONMENT-SPEC.md) |

## Active — Medium Priority

| ID | Item | Type | Component | Status |
|----|------|------|-----------|--------|
| B5 | Prompt output — emit ready-to-copy commands with resolved paths | Prompt improvement | ACM/prompts | Done |
| B6 | Ralph Loop command reliability — audit for path issues | Prompt fix | ACM/prompts | Done |
| B7 | Full prompt audit — all develop-stage prompts for stale paths and assumptions | Maintenance | ACM/prompts | Done |
| B8 | Update "commands" terminology → "skills" across all specs (per Claude Code 2.1.3) | Spec update | ACM | Done |
| B15 | Deliver stage spec | New spec | ACM | Pending |
| B18 | Design memory layer spec (MEMORY-SPEC.md) | New spec | memory | Pending |
| B19 | Scaffold memory repo at `~/code/_shared/memory/` | Setup | memory | Pending |

## Future — Low Priority

| ID | Item | Type | Component | Status |
|----|------|------|-----------|--------|
| B12 | Auto-update from upstream sources (maintenance automation for registry) | Enhancement | capabilities-registry | Done |
| B13 | Add 2-3 community sources to registry sync | Enhancement | capabilities-registry | Future |
| B14 | Automated multi-model review orchestration | Architecture | ACM | Future |
| B16 | Archive agent-harness (after registry extraction complete) | Cleanup | agent-harness | Done |
| B23 | Register untracked marketplace plugins in capabilities-registry | Maintenance | capabilities-registry | Done |
| B24 | Registry model — clarify install levels and plugin scoping (user vs project vs local) | Spec fix | capabilities-registry | Done |
| B25 | Audit action workflow — add post-audit prompt: offer to add recommendations to backlog, then offer to act on items. Partial automation toward full self-maintenance. | Enhancement | acm-env | Done |
| B26 | Trim ~/.claude/CLAUDE.md to ≤55 lines — remove Key Artifacts table (duplicates Orientation), compress Artifact Lifecycle callouts | Maintenance | ACM | Done |
| B27 | Delete docs/inbox/capability-registry-brief.md — B2 complete, ephemeral lifecycle | Cleanup | ACM | Done |
| B28 | `/acm-env:refresh` command — upstream sync orchestrator with declined workflow | New command | acm-env | Done |
| B29 | `/acm-env:capabilities` command — registry lookup for agents/users | New command | acm-env | Done |
| B30 | Fix 4 registry scripts (check-freshness, sync, promote, generate-inventory) | Bug fix | capabilities-registry | Done |
| B31 | `declined.yaml` — blocklist for evaluated-and-rejected capabilities | Enhancement | capabilities-registry | Done |
| B32 | Plugin baseline governance — baseline.yaml v2.0.0 with required/available/remove lists | Enhancement | acm-env | Done |
| B33 | Environment cleanup — remove cruft plugins, legacy commands, fix upstream URLs | Maintenance | acm-env + registry | Done |
| B20 | Evaluate extracting Knowledge (kb/) from ACM into own repo | Architecture review | ACM/kb | Future |
| B21 | Automated self-improvement loop (capture → distill → apply) | Architecture | memory + kb | Future |
| B22 | Community knowledge ingestion pipeline | Architecture | kb | Future |

---

## Completed

| ID | Item | Completed | Notes |
|----|------|-----------|-------|
| B17 | Document environment layer architecture | 2026-01-29 | ACM-ENVIRONMENT-SPEC.md created |
| B4 | Review scoring — diminishing returns | 2026-01-29 | Updated all 6 review prompts + KB entry. Severity: Critical/High/Low. Stop at zero C+H. Min 2, max 10. |
| B3 | Phase boundary protocol | 2026-01-29 | Added to ACM-DEVELOP-SPEC.md v1.2.0. Agent-driven /clear + re-read + confirm. |
| B1 | Harden start-develop prompt | 2026-01-29 | start-develop-prompt.md v2.0.0. Explicit STOP language, registry query, phase boundary protocol. |
| B2 | Extract capability registry | 2026-01-29 | 21 capabilities migrated from agent-harness. Pushed to github.com/jessepike/capabilities-registry. capability.yaml as source of truth. |
| B5 | Prompt output — resolved paths | 2026-01-29 | All prompts emit ready-to-copy commands with resolved paths. |
| B6 | Ralph Loop command reliability | 2026-01-29 | Usage sections added, run scripts created. |
| B7 | Full prompt audit | 2026-01-29 | Fixed stale registry paths and bare spec references. |
| B8 | Commands → skills terminology | 2026-01-29 | Updated across specs, brief, experiments. |
| B9 | REGISTRY-SPEC.md | 2026-01-29 | Part of B2. 4 types, tags, capability.yaml schema, lifecycle, data flow. |
| B10 | Wire acm-env → capabilities-registry | 2026-01-29 | start-develop-prompt.md points to INVENTORY.md for capability assessment. |
| B11 | Inventory generation script | 2026-01-29 | Part of B2. capability.yaml → inventory.json → INVENTORY.md. |
| B16 | Archive agent-harness | 2026-01-29 | Registry extraction complete, agent-harness disconnected from workspace. |
| B12 | Auto-update from upstream | 2026-01-30 | `/acm-env:refresh` command orchestrates sync → freshness → staging → promote workflow. |
| B23 | Register untracked plugins | 2026-01-30 | Registered 19 plugins total (original 7 + 5 cleanup batch + 7 marketplace batch). Registry grew from 21→39 capabilities. |
| B24 | Registry model — install levels | 2026-01-30 | Added `install_id` and `install_level` fields to REGISTRY-SPEC.md and all plugin capability.yaml files. User-level for cross-project, project-level for task-specific. |
| B25 | Audit action workflow | 2026-01-30 | Post-audit prompt with option to add to backlog or take action. |
| B28 | `/acm-env:refresh` command | 2026-01-30 | 10-step orchestration: snapshot → sync → declined → freshness → staging → summary → promote → decline → regenerate. |
| B29 | `/acm-env:capabilities` command | 2026-01-30 | Registry lookup showing install level, status, and install-level guidance. |
| B30 | Fix 4 registry scripts | 2026-01-30 | check-freshness: URL parsing + macOS timeout. sync: skip active + declined. promote: pipefail fix. 6 upstream URLs corrected. |
| B31 | `declined.yaml` | 2026-01-30 | 15 entries (3 MCP tools, 3 removed plugins, 9 unused LSP plugins). Integrated into sync pipeline. |
| B32 | Plugin baseline governance | 2026-01-30 | baseline.yaml v2.0.0 with required (6), available (15), remove (3) plugin lists. Reset command extended with plugin checking. |
| B33 | Environment cleanup | 2026-01-30 | Removed superpowers/example-skills/serena. Deleted 3 legacy commands. Disabled frontend-design/context7/playwright at user level. |
