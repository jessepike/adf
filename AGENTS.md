---
type: "context"
description: "ADF Codex runtime context and operating contract"
version: "1.0.0"
updated: "2026-02-10"
scope: "project"
lifecycle: "reference"
location: "AGENTS.md"
---

# ADF Codex Context

## Purpose

Use this file when operating ADF in Codex. This contract is additive and does not replace the Claude runtime contract.

## Runtime Coexistence

- Claude runtime contract: `.claude/CLAUDE.md` and `.claude/rules/`
- Codex runtime contract: `AGENTS.md`
- Shared project truth: `docs/intent.md`, `docs/brief.md`, `status.md`, `BACKLOG.md`

When guidance differs, preserve `.claude/rules/` governance boundaries and do not change Claude contracts unless explicitly asked.

## Current Stage

Develop

## Orientation

1. `.claude/rules/` — hard constraints and governance
2. `status.md` — current state, session log, next steps
3. `BACKLOG.md` — prioritized work queue
4. `docs/` and `ADF-*-SPEC.md` — source-of-truth specifications

## Working Norms

- Keep changes non-breaking for existing Claude workflows by default.
- Prefer additive compatibility layers over replacements.
- Keep MCP server interfaces stable unless a change is explicitly scoped as breaking.
- State assumptions and preserve stage discipline from ADF specs.
