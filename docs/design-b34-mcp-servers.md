---
type: "design"
project: "B34 — MCP Server Registry and Environment Support"
version: "0.1"
status: "draft"
created: "2026-01-30"
updated: "2026-01-30"
brief_ref: "./brief-b34-mcp-servers.md"
intent_ref: "./intent.md"
---

# Design: MCP Server Registry and Environment Support

## Summary

This design extends the existing capabilities registry and acm-env plugin to treat MCP servers as first-class capabilities. Three systems change: (1) the registry gains MCP-specific schema and community sources, (2) baseline.yaml gains MCP server governance, and (3) two existing acm-env commands (`refresh` and `setup`) extend to handle MCP servers alongside plugins.

No new commands. No new repos. Minimal new artifacts. We extend what exists.

---

## Orchestration

### Dependency Graph

```
1. REGISTRY-SPEC.md schema changes
   ├──→ 2a. Extract plugin-bundled MCPs (new tools/ entries)
   ├──→ 2b. Decline 4 standalone MCPs (update declined.yaml)
   ├──→ 2c. Extend baseline.yaml (add mcp_servers section)
   │         └──→ 4. Extend /acm-env:setup (reads new baseline section)
   └──→ 3. Add community sources to REGISTRY-SPEC.md
         └──→ 5. Extend /acm-env:refresh (scan MCP sources)
                  └──→ 6. Create inbox/ in capabilities-registry
                           └──→ 7. Produce first triage report

8. Regenerate inventory (after 2a, 2b complete)
```

Steps 2a, 2b, 2c, and 3 can run in parallel after step 1.

### Work Packages

| # | Package | Repo | Depends On |
|---|---------|------|------------|
| WP1 | Registry schema + sources | capabilities-registry | — |
| WP2 | Registry entries (extract + decline) | capabilities-registry | WP1 |
| WP3 | Baseline extension | acm-env | WP1 |
| WP4 | Extend refresh command | acm-env | WP1, WP3 |
| WP5 | Extend setup command | acm-env | WP3 |
| WP6 | First triage report | capabilities-registry | WP4 |
| WP7 | Regenerate inventory | capabilities-registry | WP2 |

---

## Integration Points

### Repos Touched

| Repo | Location | Changes |
|------|----------|---------|
| capabilities-registry | `~/code/_shared/capabilities-registry/` | REGISTRY-SPEC.md, declined.yaml, tools/ entries, inbox/, inventory pipeline |
| acm-env plugin | `~/.claude/plugins/acm-plugins/plugins/acm-env/` | baseline.yaml, refresh.md, setup.md |

### External Sources

| Source | URL | Access Method | Data Retrieved |
|--------|-----|---------------|----------------|
| Official MCP Registry | registry.modelcontextprotocol.io | HTTPS API (JSON) | Server names, descriptions, versions, repo URLs |
| Awesome MCP Servers | github.com/wong2/awesome-mcp-servers | GitHub raw README | Server names, descriptions, categories, repo links |
| MCP Market | mcpmarket.com | HTTPS (HTML) | Server listings, descriptions |

---

## Data Flow

### Registration Flow (new MCP server enters registry)

```
Community source scan
        ↓
Triage report (inbox/mcp-triage.md)
        ↓
Human reviews → Accept or Decline
        ↓
Accept:                          Decline:
  Create tools/<name>/             Add to declined.yaml
    capability.yaml                  (name, source, reason)
        ↓
  generate-inventory.sh
        ↓
  inventory.json + INVENTORY.md updated
```

### Plugin-Bundled MCP Extraction Flow (one-time)

```
Existing plugin entry (plugins/<name>/capability.yaml)
        ↓
Identify bundled MCP server (from plugin .mcp.json or docs)
        ↓
Create tools/<mcp-name>/capability.yaml
  install_vector: plugin
  parent_plugin: <plugin-name>
        ↓
generate-inventory.sh
```

### Install Flow (via /acm-env:setup)

```
baseline.yaml (mcp_servers section)
        ↓
/acm-env:setup detects mode
        ↓
For each required MCP server:
  Check if already configured in Claude Code
  If missing → report to user, offer to configure
        ↓
For each "remove" MCP server:
  Check if configured
  If present → report to user, offer to remove
```

---

## Detailed Changes

### WP1: Registry Schema + Sources

**File: REGISTRY-SPEC.md**

Add to `capability.yaml Schema > Optional Fields`:

```yaml
# MCP-specific fields (type: tool only)
install_vector: standalone       # standalone | plugin
parent_plugin: null              # Plugin name when install_vector: plugin
transport: stdio                 # stdio | http | sse
```

- `install_vector` — how this MCP server is installed. `standalone` means direct MCP configuration; `plugin` means installed via a parent plugin.
- `parent_plugin` — when `install_vector: plugin`, references the plugin that bundles this MCP server.
- `transport` — MCP transport protocol. Informational; helps setup know how to configure.

Add to `Sources` table:

| Source | URL | Types |
|--------|-----|-------|
| mcp-registry | registry.modelcontextprotocol.io | Tools |
| awesome-mcp | github.com/wong2/awesome-mcp-servers | Tools |
| mcp-market | mcpmarket.com | Tools |

Update `Sources` section note: "Community sources are scanned weekly via `/acm-env:refresh`. New discoveries land in `inbox/mcp-triage.md` for human review."

**File: Add `inbox/` directory**

Create `capabilities-registry/inbox/` with a `.gitkeep` and `inbox/mcp-triage.md` stub:

```markdown
# MCP Server Triage

Last scanned: (not yet scanned)

## Sources

| Source | Last Checked | Status |
|--------|-------------|--------|
| registry.modelcontextprotocol.io | — | Pending |
| github.com/wong2/awesome-mcp-servers | — | Pending |
| mcpmarket.com | — | Pending |

## New Discoveries

(None yet — run /acm-env:refresh to scan)

## Scan Summary

(Updated after each scan)
```

---

### WP2: Registry Entries

**Extract plugin-bundled MCPs** — create `tools/` entries for:

| MCP Server | Parent Plugin | Source | Transport |
|------------|---------------|--------|-----------|
| github-mcp | github | anthropic | http |
| supabase-mcp | supabase | anthropic | stdio |
| stripe-mcp | stripe | anthropic | stdio |
| vercel-mcp | vercel | anthropic | stdio |

Each gets a `capability.yaml` like:

```yaml
name: github-mcp
type: tool
description: "GitHub MCP server — repo management, issues, PRs, code search"
source: anthropic
status: active
tags: [mcp, github, vcs, code]
install_vector: plugin
parent_plugin: github
transport: http
upstream: "https://github.com/anthropics/claude-code-plugins"
added: "2026-01-30"
updated: "2026-01-30"
```

No README or supporting files needed — the plugin owns the docs. The tools/ entry is for tracking and discovery only.

**Decline 4 standalone MCPs** — move from `capabilities/tools/` to entries in `declined.yaml`:

| Name | Reason |
|------|--------|
| memory-mcp | Deferred to B18 (memory layer). Not needed for current workflows. |
| filesystem-mcp | Redundant with Claude Code built-in file tools (Read, Write, Edit, Glob, Grep). |
| everything-mcp | Test/reference implementation only. No production use case. |
| sequentialthinking-mcp | Redundant with Claude's built-in extended thinking. |

Remove their directories from `capabilities/tools/`.

---

### WP3: Baseline Extension

**File: baseline.yaml**

Add `mcp_servers` section under `user_level.checks`:

```yaml
    mcp_servers:
      scope: "cross-project only"
      note: "MCP servers needed across all projects"
      required: []
        # None required at MVP — all current MCP servers are plugin-bundled
      available:
        # Standalone MCP servers available for project-level install
        # (none currently — plugin-bundled MCPs install via their parent plugin)
      remove:
        # Known unnecessary — should not be configured
        - "memory-mcp"
        - "filesystem-mcp"
        - "everything-mcp"
        - "sequentialthinking-mcp"
```

Update `project_level.checks.mcp_servers` to match the pattern:

```yaml
    mcp_servers:
      scope: "project-specific only"
      note: "MCP servers for this project. Plugin-bundled MCPs install via their parent plugin."
      required: []
      available: []
      remove: []
```

Bump baseline version to `3.0.0`.

---

### WP4: Extend Refresh Command

**File: refresh.md**

Add after the existing "Sync from Upstream" step:

```markdown
### 3b. Scan MCP Community Sources

Scan the 3 registered MCP community sources for new servers:

1. **Official MCP Registry** (registry.modelcontextprotocol.io)
   - Fetch server list via API
   - Compare against existing tools/ entries and declined.yaml
   - Note any new or updated servers

2. **Awesome MCP Servers** (github.com/wong2/awesome-mcp-servers)
   - Fetch README content
   - Parse server listings
   - Compare against existing and declined

3. **MCP Market** (mcpmarket.com)
   - Fetch listings
   - Compare against existing and declined

For each source, identify:
- **New:** Not in registry and not in declined.yaml
- **Updated:** In registry but upstream has newer version
- **Known:** Already registered or declined (skip)

### 3c. Produce MCP Triage

Update `~/code/_shared/capabilities-registry/inbox/mcp-triage.md`:

- Update "Last Checked" dates per source
- Add new discoveries to "New Discoveries" section with:
  - Date found
  - Name
  - Source
  - One-line description
  - Agent relevance note (project fit, overlap with existing capabilities)
- Update "Scan Summary" with:
  - Total servers scanned per source
  - New discoveries count
  - Already known/declined count
  - Top recommendations (agent's curated picks with rationale)
```

Update the summary template to include MCP:

```
UPSTREAM SYNC
  Anthropic skills: [fetched|error] — N new, N active (skipped), N declined (skipped)
  MCP servers (upstream): [fetched|error] — N new, N active (skipped), N declined (skipped)

MCP COMMUNITY SCAN
  Official Registry: N total scanned, N new, N known
  Awesome MCP Servers: N total scanned, N new, N known
  MCP Market: N total scanned, N new, N known
  Top Recommendations: [curated list with relevance notes]
  Full triage: ~/code/_shared/capabilities-registry/inbox/mcp-triage.md
```

---

### WP5: Extend Setup Command

**File: setup.md**

In "Mode: Existing Project", add after the plugin checks:

```markdown
### MCP Server Checks

Read `baseline.yaml` mcp_servers section.

For each `required` MCP server:
  - Check if configured in Claude Code MCP settings
  - If missing: report and offer to configure

For each `remove` MCP server:
  - Check if configured
  - If present: report and offer to remove

For each `available` MCP server:
  - Note as available but not required
  - Only mention if relevant to current project type
```

---

### WP6: First Triage Report

After WP4 is implemented, run `/acm-env:refresh` to:
- Scan all 3 community sources
- Produce the first `inbox/mcp-triage.md` with actual data
- Validates the end-to-end workflow

---

### WP7: Regenerate Inventory

After WP2 entries are created:
- Run `generate-inventory.sh`
- Verify new MCP tool entries appear in `inventory.json` and `INVENTORY.md`
- Verify declined MCPs no longer appear in active inventory

---

## Error Handling

| Failure | Impact | Response |
|---------|--------|----------|
| Community source unreachable | Scan incomplete for that source | Report error, continue with other sources. Log in triage file. |
| API rate limiting (e.g., mcpmarket.com) | Cannot scan that source | Report and skip. Retry next scan cycle. |
| Plugin .mcp.json not accessible | Can't extract transport info | Use "unknown" transport. Note in capability.yaml. |
| generate-inventory.sh fails | Inventory stale | Report error. Fix manually. |

---

## Triggers

| Trigger | Action | Frequency |
|---------|--------|-----------|
| User runs `/acm-env:refresh` | Full sync + MCP community scan | Weekly (manual) |
| User runs `/acm-env:setup` | Check MCP baseline compliance | On demand |
| New MCP server accepted from triage | Create tools/ entry, regenerate inventory | As needed |
| MCP server declined from triage | Add to declined.yaml, remove from triage | As needed |

---

## Capabilities

No new tools or external capabilities needed. All work uses:
- Existing acm-env plugin commands (refresh, setup)
- Existing registry scripts (generate-inventory.sh, check-freshness.sh, sync.sh)
- Claude Code built-in tools (Read, Write, Edit, WebFetch, Bash)

---

## Decision Log

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| D1 | Extend existing commands, no new commands | Minimizes surface area. MCP servers are just another capability type. | New `/acm-env:mcp` command — rejected (YAGNI) |
| D2 | Plugin-bundled MCPs get separate tools/ entries | Enables independent tracking, discovery, and cross-referencing. Plugin remains install vector. | Metadata-only in plugin entry — rejected (less visible) |
| D3 | Triage file in capabilities-registry inbox/ | Registry is the MCP home. ACM inbox is for ACM-specific items. | ACM docs/inbox/ — rejected (wrong repo) |
| D4 | Full scan, curated output | Agent scans everything but surfaces top recommendations. Human isn't overwhelmed but nothing is missed. | Filtered scan — rejected (might miss things). Full list — rejected (noisy). |
| D5 | `transport` field in capability.yaml | Setup needs to know how to configure the MCP server (stdio vs http). Informational but useful. | Omit — rejected (setup would have to guess) |
| D6 | Baseline v3.0.0 with empty required list | No standalone MCPs are required at MVP. Structure is ready for when they are. | Pre-populate with candidates — rejected (YAGNI) |

---

## Backlog (Deferred)

| Item | Rationale for Deferral |
|------|----------------------|
| Automated scan via cron | Manual weekly scan is sufficient for MVP. Automate when volume warrants. |
| Unified capabilities scan (skills, agents) | Skills and agents don't have community sources yet. Refresh already skips gracefully. |
| MCP server quality scoring | Need more data points before defining a scoring rubric. Use qualitative assessment for now. |
| Memory layer MCP integration (B18) | Separate project. memory-mcp declined pending B18 design. |

---

## Open Questions

- (None — all resolved during intake)

---

## Issue Log

| # | Issue | Source | Severity | Status | Resolution |
|---|-------|--------|----------|--------|------------|

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-30 | Initial draft from Design intake |
