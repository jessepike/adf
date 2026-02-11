---
type: "spec"
description: "Defines Gemini coexistence model for ADF"
version: "1.0.0"
updated: "2026-02-10"
status: "active"
scope: "framework"
lifecycle: "living"
location: "adf/ADF-GEMINI-COMPAT-SPEC.md"
---

# ADF Gemini Compatibility Specification

## Purpose

Define how ADF supports Gemini as a first-class agent runtime alongside Claude and Codex.

## System Model

ADF supports three primary runtime contexts:

1.  **Claude (Primary/Legacy):** Uses `.claude/CLAUDE.md` + `.claude/rules/`.
2.  **Codex:** Uses `AGENTS.md`.
3.  **Gemini:** Uses `AGENTS.md` (shared with Codex).

## Runtime Contracts

| Runtime | Primary Contract | Notes |
|---|---|---|
| Claude | `.claude/CLAUDE.md` | Legacy canonical, optimized for Claude XML awareness. |
| Codex | `AGENTS.md` | Concise context, optimized for Codex. |
| Gemini | `AGENTS.md` | Concise context, optimized for Gemini/Vertex AI. |

**Rationale for Shared `AGENTS.md`:**
Codex and Gemini share similar context window characteristics and instruction tunings compared to Claude's specific XML-heavy prompting optimization. A single `AGENTS.md` file avoids context fragmentation.

## Project Initialization

`scripts/init-project.sh` supports:

-   `--runtime dual` (default): Creates `.claude/CLAUDE.md` AND `AGENTS.md`.
-   `--runtime claude-only`: Creates `.claude/CLAUDE.md`.
-   `--runtime gemini-only`: Creates `AGENTS.md`. (Alias for `codex-only` logic).
-   `--runtime codex-only`: Creates `AGENTS.md`.

## Prompt Compatibility

Prompts must not assume Claude is the only user.

**Requirements:**
-   **Context Loading:** Prompts must verify *either* `.claude/CLAUDE.md` OR `AGENTS.md` exists. If both, load both (or prefer one based on active runtime).
-   **Tooling:** References to "Claude" in tool outputs should be genericized to "Agent" or "Assistant".
-   **Review:** Gemini can perform "External Review" (Phase 2) for itself, or delegate to another model instance.

## External Review

Gemini-based agents can use the `mcp__adf__get_review_prompt` tool. The prompt content for "external" review is model-agnostic and works for Gemini self-correction or cross-model critique.
