---
type: "brief"
project: "ACM MCP Server"
version: "0.3"
status: "draft"
review_cycle: 0
created: "2026-01-31"
updated: "2026-01-31"
intent_ref: "../intent.md"
---

# Brief: ACM MCP Server

## Classification

- **Type:** App
- **Scale:** personal
- **Scope:** mvp
- **Complexity:** standalone

## Summary

Build an MCP server that exposes ACM's environment layer — specs, prompts, stubs, and project validation — as queryable tools for any agent working on an ACM-governed project. This solves the core problem of consumer projects (link-triage-pipeline, knowledge-base, etc.) having no access to ACM process knowledge when opened in isolation. The server is the interface through which agents consume the ACM framework, replacing the current dependency on multi-root IDE workspaces or manual spec reading.

This directly serves ACM's intent: stages that guide work, specs as contracts, and progressive disclosure. The MCP server is the delivery mechanism.

## Scope

### In Scope

- **Orchestration tools:** Query stage requirements, review prompts, transition prompts from ACM specs and prompts/
- **Artifact tools:** Retrieve artifact specs and starter stubs
- **Project tools:** Validate project structure and health against ACM specs
- **Governance tools:** Query rules and CLAUDE.md specs
- **Capability tools:** Query the capabilities registry (read-only, from inventory.json)
- **Knowledge tools:** Query KB entries from acm/kb/ (read-only, simple text search)
- **Transport:** stdio (local, co-located with Claude Code)
- **Language:** TypeScript (MCP SDK + Node.js)
- **Configuration:** Installable via `.mcp.json` in any consumer project
- **Location:** `acm/acm-server/` — inside ACM repo, not a sibling

### Out of Scope

- **Environment management** — acm-env plugin owns this (status, audit, setup, reset, hooks)
- **Maintenance primitive** — distributed per ACM-ARCHITECTURE-SPEC.md; acm-env handles component freshness checks. No maintenance tools in this server. (Backlog: B36)
- **Write operations to specs/prompts** — server is read-only against ACM artifacts
- **External review execution** — separate MCP server (`acm/skills/external-review/server/`), separate bounded context (API calls to external LLMs)
- **Internal review orchestration** — Ralph Loop plugin handles Phase 1
- **Knowledge base MCP server** — separate project, separate bounded context (planned within weeks)
- **Memory MCP server** — separate project, not yet designed
- **Capability installation/promotion** — acm-env's `/capabilities` command handles interactive installs
- **HTTP/SSE transport** — stdio sufficient for personal local use
- **Authentication** — local stdio, no auth needed
- **Project initialization** — acm-env's `/setup` command and `init-project.sh` handle this

## Success Criteria

- [ ] Agent in a consumer project (e.g., link-triage-pipeline) can query stage requirements without ACM repo being open
- [ ] Agent can retrieve the correct review prompt for any stage + phase combination
- [ ] Agent can validate a project's folder structure against ACM-FOLDER-STRUCTURE-SPEC
- [ ] Agent can query capabilities registry by tags, type, or keyword
- [ ] Agent can retrieve KB entries by topic
- [ ] Tool count stays within 5-15 range (target: 13)
- [ ] Server starts in <2 seconds, tool responses return in <500ms
- [ ] No stdout logging (stderr only, per MCP stdio requirements)
- [ ] Consumer project wires up via a single `.mcp.json` entry

## Constraints

- **Read-only:** The server reads ACM artifacts but never modifies them. Write operations stay in human-controlled workflows.
- **File-based backend:** All data comes from files on disk (specs, prompts, stubs, inventory.json, kb/ entries). No database.
- **Hardcoded paths:** MVP can hardcode `~/code/_shared/acm/` and `~/code/_shared/capabilities-registry/` paths, with config override for portability later.
- **Single user:** No multi-tenant concerns. Runs locally for one developer.
- **Spec stability:** ACM specs are actively evolving. The server should read files at request time, not cache at startup, so it always reflects current spec state.
- **Tool surface discipline:** Follow MCP server design KB — outcome-oriented tools, flat schemas, actionable errors, 5-15 tool maximum.

## Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| Server location | Inside `acm/acm-server/` vs sibling repo `acm-server/` | Inside `acm/acm-server/` | Server is the interface to ACM's own artifacts. Sibling repo creates coupling dependency with no benefit. Only downside is `node_modules/` in ACM repo (gitignored). |
| Project path arguments | Explicit `project_path` param vs infer from cwd | Default to cwd, optional `project_path` override | MCP server is loaded into the consumer project — cwd is already that project. Override exists for validating other projects. |
| KB search strategy | Simple text match vs semantic search | Simple text match | Only 7 KB entries today. Knowledge base MCP server (planned) will handle sophisticated search. Revisit if KB grows beyond ~20 entries. |
| Relationship to external review server | Merge review tools into ACM server vs keep separate | Keep separate | External review server has fundamentally different concerns: API keys, network calls, provider abstractions, cost. ACM server is read-only local file access. Different bounded contexts, different risk profiles, different languages (TS vs Python). |

---

## Tool Design

### Orchestration (3 tools)

**`get_stage`**

Query stage requirements, phases, and gates for a given ACM stage.

- Input: `stage` (enum: discover, design, develop, deliver)
- Returns: Stage purpose, phases with descriptions, entry/exit criteria, key artifacts produced, gates
- Reads: `ACM-STAGES-SPEC.md`, `ACM-{STAGE}-SPEC.md`
- When to use: Starting work on a project stage, understanding what's required
- When NOT to use: For review-specific information (use `get_review_prompt` instead)
- Known gap: `deliver` is a valid enum value but ACM-DELIVER-SPEC.md does not exist yet. Returns `NOT_FOUND` with remediation. (Backlog: B15, B39)

**`get_review_prompt`**

Retrieve the review prompt for a specific stage and review phase.

- Input: `stage` (enum: discover, design, develop), `phase` (enum: internal, external)
- Returns: Full review prompt text, ready for use with Ralph Loop or external review server
- Reads: `prompts/` directory, mapped as:
  - discover/internal → `ralph-review-prompt.md`
  - discover/external → `external-review-prompt.md`
  - design/internal → `design-ralph-review-prompt.md`
  - design/external → `design-external-review-prompt.md`
  - develop/internal → `develop-ralph-review-prompt.md`
  - develop/external → `develop-external-review-prompt.md`
- When to use: Running internal review (Ralph Loop) or external review (external-review MCP server)
- Note: Deliver stage review prompts not yet created

**`get_transition_prompt`**

Retrieve the prompt for transitioning between stages.

- Input: `from_stage` (enum: discover, design, develop), `to_stage` (enum: design, develop, deliver)
- Returns: Transition prompt text, pre-conditions, context to carry forward
- Reads: `prompts/start-*.md`, `prompts/*-intake-prompt.md`, mapped as:
  - discover→design → `start-design-prompt.md`, `design-intake-prompt.md`
  - design→develop → `start-develop-prompt.md`
- When to use: Project is ready to move to next stage
- When NOT to use: Mid-stage work (use `get_stage` instead)

### Artifacts (2 tools)

**`get_artifact_spec`**

Retrieve the specification for a given ACM artifact type — required sections, format, lifecycle, and exit criteria.

- Input: `artifact` (enum: intent, brief, status, rules, project-claude-md, global-claude-md, folder-structure, readme, backlog, context-artifact)
- Returns: Spec content — purpose, required sections, format requirements, lifecycle, exit criteria, relationships to other artifacts
- Reads: `ACM-{ARTIFACT}-SPEC.md`, mapped as:
  - intent → `ACM-INTENT-SPEC.md`
  - brief → `ACM-BRIEF-SPEC.md`
  - status → `ACM-STATUS-SPEC.md`
  - rules → `ACM-RULES-SPEC.md`
  - project-claude-md → `ACM-PROJECT-CLAUDE-MD-SPEC.md`
  - global-claude-md → `ACM-GLOBAL-CLAUDE-MD-SPEC.md`
  - folder-structure → `ACM-FOLDER-STRUCTURE-SPEC.md`
  - readme → `ACM-README-SPEC.md`
  - backlog → `ACM-BACKLOG-SPEC.md`
  - context-artifact → `ACM-CONTEXT-ARTIFACT-SPEC.md`
- When to use: Creating or validating an artifact, understanding what "good" looks like
- When NOT to use: Just need a starter template (use `get_artifact_stub`)

**`get_artifact_stub`**

Retrieve a starter template for a given artifact type.

- Input: `artifact` (enum: intent, brief, status, rules-constraints, claude-md-app, claude-md-artifact, claude-md-workflow)
- Returns: Template text ready to be placed in a new project
- Reads: `stubs/` directory, mapped as:
  - intent → `stubs/intent.md`
  - brief → `stubs/brief.md`
  - status → `stubs/status.md`
  - rules-constraints → `stubs/rules-constraints.md`
  - claude-md-app → `stubs/claude-md/app.md`
  - claude-md-artifact → `stubs/claude-md/artifact.md`
  - claude-md-workflow → `stubs/claude-md/workflow.md`
- When to use: Scaffolding a new project or adding a missing artifact
- When NOT to use: Need to understand spec requirements (use `get_artifact_spec`)

### Project (3 tools)

**`get_project_type_guidance`**

Get type-specific guidance for a project classification — what's different about this type, required brief extensions, review depth, recommended CLAUDE.md structure.

- Input: `project_type` (enum: artifact, app, workflow), optional `scale` (enum: personal, shared, community, commercial), optional `scope` (enum: mvp, full-build), optional `complexity` (enum: standalone, multi-component)
- Returns: Type description, required brief extensions for this type, recommended review cycle count, CLAUDE.md template variant, type-specific constraints
- Reads: `ACM-PROJECT-TYPES-SPEC.md`, `ACM-BRIEF-SPEC.md` (type extensions section), `ACM-PROJECT-CLAUDE-MD-SPEC.md`
- When to use: Starting Discover on a new project, classifying a project

**`check_project_structure`**

Validate a project's folder and artifact structure against ACM specs. Defaults to current working directory.

- Input: optional `project_path` (string, defaults to cwd)
- Returns: Pass/fail checklist — required folders present/missing, required artifacts present/missing, optional artifacts detected, overall status
- Reads: `ACM-FOLDER-STRUCTURE-SPEC.md`, then inspects target project filesystem
- When to use: After project init, during audits, before stage transitions
- When NOT to use: For content-level validation (use `check_project_health`)

**`check_project_health`**

Comprehensive health check — structure, artifact content, stage alignment, drift indicators. Defaults to current working directory.

- Input: optional `project_path` (string, defaults to cwd)
- Returns: Health report with sections:
  - Structure: folder/artifact presence (delegates to `check_project_structure` logic)
  - Intent: present, non-empty, within word count guidance
  - Brief: present, status field, review cycle count
  - Status: present, recently updated, current stage indicated
  - CLAUDE.md: present, within line limit, contains required references
  - Rules: present if declared, constraint file exists
  - Drift indicators: stage claimed vs artifacts present, brief scope vs actual deliverables
- Reads: Multiple ACM specs, then inspects target project artifacts
- When to use: Periodic health checks, before stage transitions, during reviews
- When NOT to use: Just need structure validation (use `check_project_structure`)

### Governance (2 tools)

**`get_rules_spec`**

Retrieve the rules governance model — what `.claude/rules/` contains, how it relates to CLAUDE.md, precedence hierarchy.

- Input: none
- Returns: Rules spec content — purpose, precedence model (rules > context), what belongs in rules vs CLAUDE.md, starter template reference
- Reads: `ACM-RULES-SPEC.md`
- When to use: Setting up project governance, understanding rule/context boundary

**`get_context_spec`**

Retrieve the CLAUDE.md spec for a given level — required content, constraints, what to include/exclude.

- Input: `level` (enum: global, project)
- Returns: Spec content — purpose, required sections, max line count, content boundaries, examples
- Reads: `ACM-GLOBAL-CLAUDE-MD-SPEC.md` (global) or `ACM-PROJECT-CLAUDE-MD-SPEC.md` (project)
- When to use: Creating or auditing CLAUDE.md files

### Capabilities (2 tools)

**`query_capabilities`**

Search the capabilities registry for skills, tools, agents, or plugins matching criteria.

- Input: optional `query` (string — keyword search across name, description, tags), optional `type` (enum: skill, tool, agent, plugin), optional `tags` (string[]), optional `status` (enum: active, staging, archive, default: active), `limit` (int, default: 10, max: 50)
- Returns: Array of matching capabilities — name, type, description, quality score, tags, status, source
- Reads: `~/code/_shared/capabilities-registry/inventory.json`
- When to use: Capability assessment during Design/Develop, finding tools for a specific need
- When NOT to use: Interactive install/management (use `/acm-env:capabilities`)

**`get_capability_detail`**

Get full details for a specific capability including its manifest and skill content if applicable.

- Input: `name` (string), `type` (enum: skill, tool, agent, plugin)
- Returns: Full capability.yaml contents, SKILL.md content (if skill type), file listing
- Reads: `~/code/_shared/capabilities-registry/capabilities/{type}/{name}/`
- When to use: Deep dive on a specific capability before using it
- When NOT to use: Browsing/searching (use `query_capabilities` first)

### Knowledge (1 tool)

**`query_knowledge`**

Search ACM knowledge base entries by topic. Simple text matching against titles and content.

- Input: `topic` (string)
- Returns: Array of matching KB entries — filename, title (from frontmatter or first heading), matching excerpts
- Reads: `~/code/_shared/acm/kb/*.md` (scans all markdown files, case-insensitive text match)
- When to use: Looking up ACM learnings, patterns, or validated findings
- When NOT to use: Searching the full knowledge base system (future: use knowledge-base MCP server)
- Note: Interim solution. Will be superseded by the knowledge-base MCP server for rich semantic search. This tool will remain for ACM-specific process learnings.

**Total: 13 tools**

---

## Error Design

Following MCP server design KB (see `acm/kb/mcp-server-design-knowledge-base-agent-ready.md`):

### Error Response Format

All tool responses follow a consistent structure:

```typescript
// Success
{
  ok: true,
  result: { ... },      // Tool-specific typed result
  summary: string,       // Short human-readable summary
  warnings: string[]     // Optional warnings (e.g., "Deliver stage spec not yet created")
}

// Error
{
  ok: false,
  error_code: string,    // Machine-readable: NOT_FOUND, INVALID_ARGUMENT, INTERNAL_ERROR
  summary: string,       // Human-readable: what went wrong
  remediation: string    // What the agent can do about it
}
```

### Error Behaviors

- **Missing spec file:** `NOT_FOUND` with remediation: "ACM-DELIVER-SPEC.md does not exist yet. The Deliver stage spec has not been created."
- **Invalid enum value:** `INVALID_ARGUMENT` with remediation listing valid values
- **Project path not found:** `NOT_FOUND` with remediation: "Directory does not exist. Check the path or omit project_path to use cwd."
- **No search results:** Return `ok: true` with empty results and hints: "No capabilities matched tags ['supabase']. Try broader tags or run /acm-env:refresh to update the registry."
- **File read failure:** `INTERNAL_ERROR` with remediation: "Could not read {file}. Check file permissions."

---

## Implementation

### Technology

- **SDK:** `@modelcontextprotocol/sdk` (TypeScript)
- **Transport:** `StdioServerTransport`
- **Runtime:** Node.js (LTS)
- **File reading:** Node.js `fs/promises` — read files at request time, no caching
- **YAML parsing:** `js-yaml` for frontmatter extraction from spec files
- **JSON parsing:** Native `JSON.parse` for inventory.json
- **Validation:** `zod` for input schema validation (comes with MCP SDK)
- **Logging:** `console.error` only (stderr) — never stdout per stdio transport rules

### Project Structure

Located at `acm/acm-server/` within the ACM repo:

```
acm/acm-server/
├── src/
│   ├── index.ts              # Server entry, tool registration
│   ├── tools/
│   │   ├── orchestration.ts  # get_stage, get_review_prompt, get_transition_prompt
│   │   ├── artifacts.ts      # get_artifact_spec, get_artifact_stub
│   │   ├── project.ts        # get_project_type_guidance, check_project_structure, check_project_health
│   │   ├── governance.ts     # get_rules_spec, get_context_spec
│   │   ├── capabilities.ts   # query_capabilities, get_capability_detail
│   │   └── knowledge.ts      # query_knowledge
│   ├── readers/
│   │   ├── spec-reader.ts    # Read and parse ACM spec files (frontmatter + content)
│   │   ├── prompt-reader.ts  # Read prompt files by stage+phase mapping
│   │   ├── stub-reader.ts    # Read stub templates by artifact type mapping
│   │   ├── registry-reader.ts # Read inventory.json, query capabilities, read capability details
│   │   └── kb-reader.ts      # Scan kb/ directory, text-match against entries
│   └── config.ts             # Path configuration (ACM_ROOT, REGISTRY_ROOT, overridable)
├── package.json
├── tsconfig.json
└── README.md
```

### Path Configuration

```typescript
// config.ts — resolved at startup, overridable via environment variables
export const ACM_ROOT = process.env.ACM_ROOT || path.join(os.homedir(), 'code/_shared/acm');
export const REGISTRY_ROOT = process.env.REGISTRY_ROOT || path.join(os.homedir(), 'code/_shared/capabilities-registry');
```

### File Mapping Tables

The server maintains static maps from tool input enums to file paths. Examples:

```typescript
// Spec files
const SPEC_MAP: Record<string, string> = {
  'intent': 'ACM-INTENT-SPEC.md',
  'brief': 'ACM-BRIEF-SPEC.md',
  'status': 'ACM-STATUS-SPEC.md',
  // ...
};

// Prompt files (stage × phase)
const PROMPT_MAP: Record<string, Record<string, string>> = {
  'discover': { 'internal': 'ralph-review-prompt.md', 'external': 'external-review-prompt.md' },
  'design': { 'internal': 'design-ralph-review-prompt.md', 'external': 'design-external-review-prompt.md' },
  'develop': { 'internal': 'develop-ralph-review-prompt.md', 'external': 'develop-external-review-prompt.md' },
};

// Stub files
const STUB_MAP: Record<string, string> = {
  'intent': 'intent.md',
  'brief': 'brief.md',
  'claude-md-app': 'claude-md/app.md',
  // ...
};
```

---

## Consumer Wiring

### Per-project (recommended)

Add to `.mcp.json` in the consumer project root:

```json
{
  "mcpServers": {
    "acm": {
      "command": "node",
      "args": ["/Users/jessepike/code/_shared/acm/acm-server/build/index.js"]
    }
  }
}
```

### Global (alternative)

Add to `~/.claude.json` to make available in all projects:

```json
{
  "mcpServers": {
    "acm": {
      "command": "node",
      "args": ["/Users/jessepike/code/_shared/acm/acm-server/build/index.js"]
    }
  }
}
```

### Alongside External Review Server

Projects using both ACM process knowledge and external review:

```json
{
  "mcpServers": {
    "acm": {
      "command": "node",
      "args": ["/Users/jessepike/code/_shared/acm/acm-server/build/index.js"]
    },
    "external-review": {
      "command": "python",
      "args": ["/Users/jessepike/code/_shared/acm/skills/external-review/server/external_review_server.py"]
    }
  }
}
```

---

## Relationship to Other Components

### acm-env Plugin

- **No overlap in tools** — acm-env manages environment config (plugins, settings, hooks, baseline); this serves process knowledge (specs, prompts, validation)
- **Shared data sources** — both read from capabilities-registry and ACM specs
- **Future integration** — acm-env:audit could delegate spec-level validation to this server's `check_project_health` tool
- **baseline.yaml update** — add ACM MCP server to available MCP servers list once built
- See: `docs/inbox/acm-mcp-server-architecture-decisions.md` for full analysis

### External Review MCP Server (ACM-EXTERNAL-REVIEW-SKILL-SPEC.md)

- **Distinct bounded context** — external review server handles API calls to external LLMs (Kimi K2, Gemini, DeepSeek); this server handles local file reads
- **Consumer relationship** — external review workflow can use this server's `get_review_prompt(stage, "external")` to retrieve the correct prompt before calling `external-review.review()` to send it to external models
- **No tool overlap** — this server serves prompts; external review server executes them
- **Different tech stacks** — this server is TypeScript/Node; external review is Python (provider abstractions, async HTTP)
- **Different risk profiles** — this server has zero external dependencies; external review has API keys, network calls, cost

### Ralph Loop Plugin (Internal Review)

- **No overlap** — Ralph Loop is a plugin that orchestrates iterative review cycles; this server provides the prompts Ralph Loop consumes
- **Consumption pattern** — Ralph Loop uses `get_review_prompt(stage, "internal")` to get the right prompt, then runs its cycle

### Future MCP Servers

| Server | Bounded Context | Relationship to ACM Server |
|--------|----------------|---------------------------|
| Knowledge Base | Semantic search, ingestion pipeline, vector store | Supersedes `query_knowledge` for rich queries. ACM server's `query_knowledge` remains for ACM-specific process learnings in `kb/`. |
| Memory | Session logs, cross-project state, history | ACM server's `check_project_health` could read memory for session recency. Deferred. |

### Self-Improvement Loop (ACM-ARCHITECTURE-SPEC.md)

The architecture spec defines a self-improvement loop: capture → distill → apply → validate. This server supports the **apply** step — agents query `query_knowledge` to reuse captured learnings during project work. The **capture** and **distill** steps are future concerns owned by the Memory and Knowledge Base MCP servers respectively. (Backlog: B38)

---

## Issue Log

| # | Issue | Source | Impact | Priority | Status | Resolution |
|---|-------|--------|--------|----------|--------|------------|
| - | - | - | - | - | - | - |

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-31 | Initial draft |
| 0.2 | 2026-01-31 | Resolved open questions (server location, path args, KB search). Added decisions table. Added external review alignment. Expanded tool descriptions with when-to-use/when-not. Added error response format. Added path configuration details. Added relationship to external review and Ralph Loop. |
| 0.3 | 2026-01-31 | Internal review fixes: added maintenance primitive exclusion note, standardized "environment layer" terminology, added self-improvement loop connection, added deliver stage known gap. Updated ACM-ENVIRONMENT-SPEC.md references to ACM-ARCHITECTURE-SPEC.md. Added backlog items B36-B40. |
