---
type: "specification"
description: "Defines tasks.md — atomic task tracking and phase handoff across all stages"
version: "1.0.0"
updated: "2026-02-04"
scope: "adf"
lifecycle: "reference"
location: "adf/ADF-TASKS-SPEC.md"
---

# ADF Tasks Specification

## Purpose

Define `tasks.md` — a cross-stage artifact that tracks atomic tasks with status, provides phase handoff context, and maintains execution history. This is an **environment-layer artifact** that persists across all stages.

---

## Why Tasks.md

| Problem | Solution |
|---------|----------|
| status.md becomes cluttered with task details | Separate concerns — status.md tracks session state, tasks.md tracks execution |
| Agent loses task context between sessions | tasks.md captures handoff block and task status |
| Phase transitions lose context | Handoff block carries forward what matters |
| No traceability for completed work | Completed section accumulates across phases |
| backlog.md conflates queue and active work | backlog = queue of potential work; tasks = active execution |

---

## Relationship to Other Artifacts

| Artifact | Role | Stage Relevance |
|----------|------|-----------------|
| **CLAUDE.md** | Context manifest — points to tasks.md in Develop/Deliver | All stages |
| **status.md** | Lightweight session state | All stages |
| **backlog.md** | Queue of potential work items | All stages |
| **tasks.md** | Active execution tracking with handoff | All stages (minimal in Discover/Design, full in Develop/Deliver) |
| **plan.md** | Implementation/deployment approach | Develop, Deliver |

**Relationship to backlog.md:**
- **backlog.md** = queue of potential next work (prioritized list, items waiting to be picked up)
- **tasks.md** = active execution (items currently being worked, with status and acceptance criteria)
- Items graduate from backlog to tasks when selected for a phase

**Environment-layer artifact:** Tasks.md is always present. In early stages, it's minimal. In later stages, it provides full task tracking with handoff blocks and progressive disclosure.

---

## Content Structure

Tasks.md uses progressive disclosure — show what the agent needs now, hide what it doesn't.

### Minimal Structure (Init/Discover/Design)

For early stages with lightweight task tracking:

```markdown
---
project: "[Project Name]"
stage: "Discover"
current_phase: "Exploration"
updated: "YYYY-MM-DD"
---

# Tasks

## Handoff

| Field | Value |
|-------|-------|
| Phase | — |
| Status | Not started |
| Next | [First phase] |
| Blocker | None |

## Active Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| — | No active tasks | — | — |

## Completed

_No completed tasks yet._
```

### Full Structure (Develop/Deliver)

For execution stages with detailed task tracking:

```markdown
---
project: "[Project Name]"
stage: "Develop"
current_phase: "Phase 1: Core Structure"
updated: "YYYY-MM-DD"
---

# Tasks

## Handoff

| Field | Value |
|-------|-------|
| Phase | {completed phase name} |
| Status | Complete |
| Next | {next phase name} |
| Blocker | {blocker or "None"} |

**Done this phase:**
- {task ID}: {brief summary}
- {task ID}: {brief summary}

**Next phase requires:**
- {what to start, key dependencies, any setup needed}

**Build notes:**
- {decisions made, gotchas discovered, anything the next phase needs to know}

## Active Tasks

| ID | Task | Status | Acceptance Criteria | Testing | Depends | Capability |
|----|------|--------|---------------------|---------|---------|------------|
| 1.1 | Set up project structure | pending | Project scaffolded | Unit: project loads | — | npm CLI |
| 1.2 | Configure dependencies | pending | All deps installed | Unit: imports work | 1.1 | — |

## Upcoming

| ID | Task | Status | Acceptance Criteria | Testing | Depends | Capability |
|----|------|--------|---------------------|---------|---------|------------|
| 2.1 | Implement feature A | pending | Feature works | E2E: user flow | 1.2 | — |

## Completed

### Phase 0: Planning

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| 0.1 | Draft plan.md | 2026-02-01 | Approved in review |
| 0.2 | Create task breakdown | 2026-02-01 | 15 tasks across 3 phases |
```

---

## Field Values

### Status

| Value | Meaning | When to Use |
|-------|---------|-------------|
| `pending` | Ready to pick up | Task defined, dependencies met |
| `in-progress` | Actively being worked | Agent has started work |
| `done` | Completed successfully | Acceptance criteria met |
| `blocked` | Cannot proceed | Waiting on dependency or decision |

### Columns (Full Structure)

| Column | Required | Description |
|--------|----------|-------------|
| **ID** | Yes | Task identifier (e.g., `1.1`, `A1`, `5.3`). Phase prefix + sequence. |
| **Task** | Yes | Brief description of what to do |
| **Status** | Yes | Current status (see above) |
| **Acceptance Criteria** | Yes | How to verify completion |
| **Testing** | Yes | What tests cover this task |
| **Depends** | Yes | Task IDs this depends on (`—` if none) |
| **Capability** | Yes | Required capability from capabilities.md (`—` if none) |

### Columns (Minimal Structure)

| Column | Required | Description |
|--------|----------|-------------|
| **ID** | Yes | Simple sequence or `—` |
| **Task** | Yes | Brief description |
| **Status** | Yes | Current status |
| **Notes** | No | Additional context |

---

## Stage-Specific Behavior

### Discover Stage

**Structure:** Minimal
**Purpose:** Lightweight tracking of exploration tasks

Tasks are simple and sequential:
- "Research competitor X"
- "Interview stakeholder Y"
- "Draft initial brief"

No complex dependencies or capabilities needed.

### Design Stage

**Structure:** Minimal or transitioning to Full
**Purpose:** Track design tasks and decisions

Tasks may start simple and grow:
- "Identify architecture options"
- "Document data model"
- "Draft design.md"

Consider transitioning to full structure if:
- Multiple parallel design tracks
- Complex dependencies between design decisions
- Need to track capability requirements

### Develop Stage

**Structure:** Full
**Purpose:** Comprehensive task tracking with handoff, capabilities, and testing

Tasks follow the plan.md phases. Each task must have:
- Clear acceptance criteria
- Testing approach
- Dependencies mapped
- Required capabilities identified

**Handoff block is critical.** Updated at every phase boundary per ADF-DEVELOP-SPEC.md Phase Boundary Protocol.

### Deliver Stage

**Structure:** Full
**Purpose:** Track deployment tasks with validation

Tasks cover:
- Infrastructure setup
- Deployment execution
- Multi-tier validation (automated, browser, manual)
- Access documentation

Uses same handoff block and progressive disclosure as Develop.

---

## Handoff Block Format

The Handoff section lives at the top of tasks.md (after frontmatter, before phase tables). It is **overwritten** at each phase boundary — only the current handoff matters.

### Required Format

```markdown
## Handoff

| Field | Value |
|-------|-------|
| Phase | {completed phase name} |
| Status | Complete |
| Next | {next phase name} |
| Blocker | {blocker or "None"} |

**Done this phase:**
- {task ID}: {brief summary}
- {task ID}: {brief summary}

**Next phase requires:**
- {what to start, key dependencies, any setup needed}

**Build notes:**
- {decisions made, gotchas discovered, anything the next phase needs to know}
```

### Rules

- **Overwrite, don't append.** Each boundary replaces the previous handoff block.
- **Keep it short.** 10-20 lines max. This is orientation, not a journal.
- **Build notes are optional.** Omit the section if there's nothing worth noting.
- **Phase field uses the phase name**, not just a number (e.g., "Phase 3: Planning", not "3").

### What Carries Across Phases

Via artifacts, not memory:
- `tasks.md` — handoff block + task status (primary orientation artifact)
- `status.md` — current state, session-level summary
- `plan.md` — implementation plan, decision log
- `manifest.md` / `capabilities.md` — dependencies and capabilities

What does NOT carry across:
- In-context assumptions from previous phase work
- Intermediate reasoning or exploration
- Abandoned approaches or discarded options

---

## Progressive Disclosure Rules

Agents should read efficiently:

1. **Start with Handoff** — understand current context
2. **Read Active Tasks** — what to work on now
3. **Skip Completed** — unless investigating history
4. **Scan Upcoming** — for planning context only

When phase completes:
1. Move completed tasks to Completed section
2. Promote Upcoming to Active (next phase's tasks)
3. Update frontmatter `current_phase`
4. Overwrite Handoff block with new phase context

---

## Task Granularity Guidance

A well-scoped task:
- Can be completed by one agent in one session
- Has clear, verifiable acceptance criteria
- Has defined testing approach
- Can be marked complete with confidence

**Too large:** "Build the authentication system"
**Right size:** "Implement login endpoint with JWT validation"

**Too small:** "Add semicolon to line 42"
**Right size:** "Fix linting errors in auth module"

---

## Maintenance Rules

### Adding Tasks

- Assign next available ID in current phase
- Set status to `pending`
- Fill all required columns
- Map dependencies to existing task IDs

### Completing Tasks

- Change status to `done`
- At phase boundary: move entire phase's tasks to Completed section with completion date

### Blocked Tasks

- Change status to `blocked`
- Note blocker in Handoff block or task Notes
- Unblock by resolving dependency, then change back to `pending`

### Reprioritizing

- Reorder tasks within Active section
- Update Upcoming if priorities shift
- Note rationale in Handoff block if significant

---

## Session Protocol

### Session Start (Agent)

1. Read CLAUDE.md (manifest)
2. CLAUDE.md points to tasks.md
3. Read tasks.md Handoff block first
4. Understand: current phase, what was done, what's next
5. Read Active Tasks
6. Pick up where previous session left off

### Session End (Agent)

1. Update task status for any completed work
2. Update Handoff block if phase boundary reached
3. Update `updated` date in frontmatter
4. Commit changes

### Phase Boundary (Agent)

Per stage spec Phase Boundary Protocol:

1. Complete phase work
2. Update Handoff block in tasks.md
3. Update status.md with phase completion summary
4. Commit all changes
5. Update `current_phase` in frontmatter
6. Move completed tasks to Completed section
7. Run `/clear`
8. Re-read artifacts fresh
9. Confirm: "Phase N complete. Starting Phase N+1. Here's what I see: [brief summary from handoff block]"

---

## Stage Transitions

### Stage Accumulation Behavior

**Active Tasks:** Reset per stage — new stage, new active tasks
**Completed:** Accumulates — full traceability across all stages

At stage transition:
1. Archive current stage's `tasks.md` to `docs/adf/archive/` (or `_archive/`)
2. Create fresh `tasks.md` for new stage
3. Or: clear Active/Upcoming, keep Completed for historical reference

### Discover → Design

- Minimal → Minimal (or transitioning to Full)
- Completed section carries forward for context
- Reset Active for Design tasks

### Design → Develop

- Minimal/Full → Full
- Completed section carries forward
- New Active tasks from plan.md breakdown

### Develop → Deliver

- Full → Full
- Archive Develop's planning artifacts
- Fresh tasks.md for delivery tasks
- Or: Continue same file with new phase

---

## Validation Criteria

A well-formed tasks.md:

- [ ] Has frontmatter with project, stage, current_phase, updated
- [ ] Has Handoff section with required table fields
- [ ] Has Active Tasks section (even if empty)
- [ ] Has Completed section (even if empty)
- [ ] Task IDs are unique within file
- [ ] Status values are valid (pending, in-progress, done, blocked)
- [ ] Dependencies reference valid task IDs
- [ ] Updated at end of each session
- [ ] Handoff block updated at phase boundaries

### Full Structure Additional Criteria

- [ ] All required columns present (ID, Task, Status, Acceptance Criteria, Testing, Depends, Capability)
- [ ] Acceptance criteria are verifiable
- [ ] Testing approach specified for each task
- [ ] Capabilities link to capabilities.md entries

---

## File Location

```
/project-root/
  docs/
    intent.md
    discover-brief.md
    status.md
    tasks.md          # <-- Cross-stage task tracking
  CLAUDE.md
  README.md
```

No stage prefix needed — there's only one tasks.md per project.

**Note:** During Develop/Deliver, `docs/adf/tasks.md` may be used for stage-specific task tracking per the existing convention. Projects may choose either location; the important thing is consistency and that CLAUDE.md references the correct location.

---

## References

- ADF-STATUS-SPEC.md (Session state complement)
- ADF-BACKLOG-SPEC.md (Queue complement)
- ADF-DEVELOP-SPEC.md (Develop phase boundary protocol)
- ADF-DELIVER-SPEC.md (Deliver phase boundary protocol)
- ADF-STAGES-SPEC.md (Stage transition cleanup)
- ADF-FOLDER-STRUCTURE-SPEC.md (File location conventions)
