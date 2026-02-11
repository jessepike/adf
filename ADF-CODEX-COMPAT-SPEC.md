---
type: "spec"
description: "Defines non-breaking Codex coexistence model for ADF"
version: "1.0.0"
updated: "2026-02-10"
status: "active"
scope: "framework"
lifecycle: "living"
location: "adf/ADF-CODEX-COMPAT-SPEC.md"
---

# ADF Codex Compatibility Specification

## Purpose

Define how ADF supports Codex without breaking existing Claude-native workflows.

## Phase 1 Scope (Non-Breaking)

In scope:
- Additive Codex runtime contract (`AGENTS.md`)
- Bootstrap support for dual runtime scaffolding
- Prompt language updates that remove Claude-only runtime assumptions

Out of scope:
- Breaking MCP API renames (for example `claude_md`)
- Removal of `.claude/` contracts or CLAUDE.md flows
- Full rewrite of all historical specs into provider-neutral language

## Runtime Contracts

| Runtime | Primary Contract | Notes |
|--------|------------------|-------|
| Claude Code | `.claude/CLAUDE.md` + `.claude/rules/` | Existing canonical contract remains valid |
| Codex | `AGENTS.md` | Additive contract for Codex usage |

Shared truth artifacts for both runtimes:
- `docs/intent.md`
- `docs/brief.md`
- `status.md`
- `BACKLOG.md`

## Precedence and Conflict Rules

1. `.claude/rules/` remains authoritative for governance constraints.
2. `AGENTS.md` must not require behavior that violates `.claude/rules/`.
3. Runtime-specific guidance should be isolated to runtime-specific contracts.
4. Shared ADF behavior must be documented in specs and shared artifacts, not duplicated with conflicting variants.

## Mapping: Claude Concepts to Codex Equivalents

| Concern | Claude-Native | Codex-Native | Compatibility Behavior |
|---------|---------------|--------------|------------------------|
| Runtime instruction file | `.claude/CLAUDE.md` | `AGENTS.md` | Keep both in dual mode |
| Hard constraints | `.claude/rules/` | `.claude/rules/` | Shared governance layer |
| Project setup | `scripts/init-project.sh` (Claude-oriented scaffolding) | same script with runtime mode | Default to dual runtime |
| Browser test mention | "Claude in Chrome" | browser automation tool | Use neutral wording with examples |

## Bootstrap Requirements

`scripts/init-project.sh` must support:
- `--runtime dual` (default)
- `--runtime claude-only`
- `--runtime codex-only`

Expected behavior:
- `dual`: create both `.claude/CLAUDE.md` and `AGENTS.md`
- `claude-only`: create `.claude/CLAUDE.md` only
- `codex-only`: create `AGENTS.md` only (still keep `.claude/rules/` unless user explicitly opts out)

## Prompt Language Requirements

Stage prompts should:
- Avoid requiring one vendor runtime
- Preserve existing review semantics (internal/external/Ralph Loop)
- Use neutral browser tooling phrasing with optional examples

## MCP Server Compatibility (Phase 1)

No API/surface changes:
- Keep tool names and enums unchanged
- Keep `claude_md` references unchanged
- Keep current governance/context tool semantics

## Phase 2 (Deferred)

Phase 2 may add non-breaking aliases for neutral naming:
- `claude_md` -> `context_md` alias
- Neutralized context spec naming while preserving existing methods

These changes must be additive first, then optionally deprecate legacy names with a migration window.
