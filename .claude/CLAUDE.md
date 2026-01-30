---
type: "context"
description: "ACM project context — the agentic context management framework"
version: "1.0.0"
updated: "2026-01-29"
scope: "project"
lifecycle: "reference"
location: ".claude/CLAUDE.md"
---

# ACM Project Context

## What This Is

ACM (Agentic Context Management) is the framework that defines how agentic projects are structured, managed, and maintained. It owns orchestration, knowledge, and the specs that govern all stages.

## Orientation

1. `.claude/rules/` — Hard constraints (read first, always enforced)
2. `status.md` — Current state, session log, next steps
3. `BACKLOG.md` — All tracked work items
4. `ACM-ENVIRONMENT-SPEC.md` — Environment layer architecture (six primitives)
5. `ACM-STAGES-SPEC.md` — Stage workflow (Discover → Design → Develop → Deliver)

## Context Map

| Artifact | Purpose |
|----------|---------|
| `.claude/rules/` | Hard constraints — non-negotiable policy |
| `ACM-*-SPEC.md` | Process and artifact specifications |
| `ACM-TAXONOMY.md` | Classification system and design decisions |
| `prompts/` | Stage transition and review prompts |
| `kb/` | Knowledge base — curated learnings |
| `stubs/` | Project scaffolding templates |
| `scripts/` | Init and review runner scripts |
| `experiments/` | Validation experiments (Ralph Loop) |

## Current Stage

**Develop** — building out the ACM framework itself and its environment layer.

## Related Repos

| Repo | Location | Purpose |
|------|----------|---------|
| capabilities-registry | `~/code/_shared/capabilities-registry/` | Capability catalog (skills, tools, agents, plugins) |
| link-triage-pipeline | `~/code/_shared/link-triage-pipeline/` | Link processing pipeline (Discover complete, entering Design) |
| acm-env plugin | `~/.claude/plugins/acm-plugins/plugins/acm-env/` | Environment management plugin |

## Working Norms

- Token-efficient — every artifact earns its context cost
- Progressive disclosure — summary first, details on demand
