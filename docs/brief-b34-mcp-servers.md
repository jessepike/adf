---
type: "brief"
project: "B34 — MCP Server Registry and Environment Support"
version: "1.0"
status: "complete"
review_cycle: 2
signed_off: "2026-01-30"
created: "2026-01-30"
updated: "2026-01-30"
intent_ref: "./intent.md"
---

# Brief: MCP Server Registry and Environment Support

## Classification

- **Type:** Workflow
- **Scale:** personal
- **Scope:** mvp
- **Complexity:** multi-component

## Summary

MCP servers are a first-class capability type in the ACM environment. They can exist as standalone tools or be bundled inside plugins, but either way they need individual registry entries, governance via baseline, and environment install support. This project establishes the full lifecycle for MCP servers — from community discovery through registration, governance, and installation — mirroring what already exists for plugins.

## Scope

### In Scope

- Define MCP server registration standards in REGISTRY-SPEC.md (capability.yaml schema for type: tool)
- Extract and register MCP servers bundled in existing plugins (github, supabase, stripe, vercel) as separate tools/ entries
- Decline the 4 standalone MCPs currently in registry (memory, filesystem, everything, sequentialthinking) with rationale in declined.yaml
- Extend baseline.yaml with an `mcp_servers` section alongside plugins
- Define scan/triage workflow against 3 community sources
- Register community sources as reference endpoints
- Add MCP install/uninstall support to acm-env plugin
- Update INVENTORY.md generation to reflect MCP server entries accurately

### Out of Scope

| Exclusion | Rationale |
|-----------|-----------|
| Memory layer design (memory-mcp, claude-mem) | Deferred to B18 |
| Building custom MCP servers | Separate project if needed |
| Automated scan execution (cron, CI) | Manual weekly scan is sufficient for MVP |
| MCP server development tooling | Out of scope — we consume, not build |
| Community source API integration scripts | Manual fetch is fine for MVP; automate later if volume warrants |

## Success Criteria

- [ ] REGISTRY-SPEC.md updated with MCP-specific registration standards
- [ ] Each plugin-bundled MCP server has its own capability.yaml in tools/ with install_vector referencing the parent plugin
- [ ] 4 current standalone MCPs moved to declined.yaml with rationale
- [ ] baseline.yaml v3.0.0 includes `mcp_servers` section (required/available/remove)
- [ ] Scan/triage workflow documented (sources, cadence, output format, decision criteria)
- [ ] acm-env can install and uninstall standalone MCP servers when explicitly instructed (manual for MVP; automation deferred)
- [ ] inventory.json and INVENTORY.md accurately reflect MCP server entries
- [ ] First triage report produced from community sources

## Constraints

- **YAGNI** — only register MCP servers with demonstrated value; don't catalog for completeness
- **Lightweight entries** — capability.yaml for MCP servers should be minimal (enough to identify, evaluate, link)
- **No auto-staging** — all new MCP servers require human review before entering the registry
- **Plugin-bundled MCPs** — the plugin remains the install vector; the tools/ entry is for tracking and discovery, not independent installation
- **Community sources** — 3 registered sources, scanned weekly, triage report only
- **Manual workflow** — user triggers scan/triage explicitly; automation (cron) deferred to post-MVP

## Community Sources

| Source | URL | Type | Role |
|--------|-----|------|------|
| Official MCP Registry | registry.modelcontextprotocol.io | API-driven | Primary — structured metadata, server.json manifests |
| Awesome MCP Servers | github.com/wong2/awesome-mcp-servers | Curated list | Discovery — breadth and categorization |
| MCP Market | mcpmarket.com | Marketplace | Secondary lens |

## Resolved Questions

### capability.yaml schema for MCP servers

Unified schema — same structure for standalone and plugin-bundled, two additional fields:

```yaml
name: github-mcp
type: tool
source: modelcontextprotocol
install_vector: standalone | plugin
parent_plugin: github              # only when install_vector: plugin
upstream: https://github.com/...
tags: [mcp, github, vcs]
quality: null                      # null = inherited from plugin; scored for standalone
status: active | declined
```

### Triage report format

Standing file at `inbox/mcp-triage.md` in the capabilities-registry repo — updated in place, not replaced weekly. (Create `inbox/` in capabilities-registry if it doesn't exist.)

- Last scanned date per source
- Running list of new discoveries: date found, name, source, one-line description
- Agent adds relevance note per item (project fit, overlap with existing capabilities)
- Items move out once acted on — accepted into registry or added to declined.yaml

### Evaluation criteria

Agent performs initial triage with relevance signal; human makes final accept/decline decision. Agent considers:

- **Redundancy** — does this overlap with existing capabilities (built-in tools, registered MCPs, plugin-bundled)?
- **Project fit** — relevant to any active or planned projects?
- **Maturity** — actively maintained, stars/adoption signals, official vs. community?
- **YAGNI** — does this solve a current need or is it speculative?

## Open Questions

- (None — all resolved during alignment session)

## Issue Log

| # | Issue | Source | Severity | Status | Resolution |
|---|-------|--------|----------|--------|------------|
| 1 | mcpmarket.com rate-limited on initial fetch | Discovery | Low | Open | Retry later or use browser |
| 2 | acm-env install/uninstall underspecified — what does it install at MVP? | Ralph-Internal | High | Resolved | Clarified: manual install of standalone MCPs when user instructs; automation deferred |
| 3 | Triage workflow trigger undefined — who runs it, how? | Ralph-Internal | High | Resolved | Clarified: user-triggered manual scan for MVP; cron deferred |
| 4 | Issue Log columns didn't match spec template | Ralph-Internal | Low | Resolved | Aligned to spec: Severity/Status columns |
| 5 | Triage file location in wrong repo (ACM vs capabilities-registry) | Ralph-Internal | Low | Resolved | Moved to capabilities-registry inbox/ |

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-30 | Initial draft from B34 alignment session |
| 0.2 | 2026-01-30 | Resolved open questions: capability.yaml schema, triage format, evaluation criteria |
| 0.3 | 2026-01-30 | Review cycle 1: addressed 2 High issues (install scope, workflow trigger), 2 Low issues (log format, triage location) |
| 1.0 | 2026-01-30 | Review cycle 2: clean — zero Critical/High. Signed off, Discover complete. |
