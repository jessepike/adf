# Execute-Plan Design Review - Cycle 1

**Artifact:** execute-plan-design.md v0.1
**Reviewer:** Ralph Loop (Internal Review)
**Date:** 2026-02-02
**Focus:** Architecture, orchestration patterns, dependency resolution, error handling, integration points, YAGNI compliance

---

## Executive Summary

**Overall Assessment:** Design is **SOLID** with good research-backed patterns. Ready to proceed to implementation with **3 High issues** to address first.

**Severity Breakdown:**
- **Critical:** 0
- **High:** 3
- **Medium:** 5
- **Low:** 4

**Recommendation:** Address High issues before implementation. Medium/Low issues can be deferred or noted for future consideration.

---

## Review Findings

### [High] Task grouping algorithm may create unbalanced parallel execution

**Location:** Task Grouping Strategy section (lines 194-255)

**Issue:** The sequential ID heuristic `is_sequential_id()` only groups tasks if their IDs increment by exactly 1 (e.g., 2.1 → 2.2). This breaks down when:
- Tasks have gaps in numbering (e.g., 2.1, 2.3, 2.5 after some tasks were removed)
- Fix tasks are added dynamically (e.g., 1.14, 1.15 after 1.13)

**Example failure:**
```
Ready tasks: 2.1, 2.3, 2.5, 2.7 (tasks 2.2, 2.4, 2.6 were consolidated)

Current algorithm produces:
- Group A: 2.1 (not sequential with 2.3)
- Group B: 2.3 (not sequential with 2.5)
- Group C: 2.5 (not sequential with 2.7)
- Group D: 2.7

Result: 4 groups of 1 task each (no parallelization benefit)
```

**Impact:** Defeats purpose of parallelization, forces sequential execution even when tasks are independent.

**Recommendation:** Use looser grouping criteria:
```python
def group_tasks_flexible(ready_tasks):
    """Group tasks by phase number, ignore exact sequential IDs"""
    groups = []
    tasks_by_phase = {}

    # Group by phase (e.g., all 2.X together)
    for task in ready_tasks:
        phase = int(task.id.split('.')[0])
        if phase not in tasks_by_phase:
            tasks_by_phase[phase] = []
        tasks_by_phase[phase].append(task)

    # Split each phase's tasks into groups of max 4
    for phase, phase_tasks in tasks_by_phase.items():
        sorted_tasks = sorted(phase_tasks, key=lambda t: float(t.id))
        for i in range(0, len(sorted_tasks), 4):
            groups.append(sorted_tasks[i:i+4])

    return groups[:5]  # Max 5 parallel
```

This groups all Phase 2 tasks together regardless of gaps, then splits into chunks of 4.

---

### [High] No mechanism to detect "stuck" state when task never becomes ready

**Location:** Dependency Resolution section (lines 155-191), Error Handling section (lines 471-557)

**Issue:** The design states "Task never becomes 'ready', surfaces as stuck" but provides no actual detection mechanism. If a task has an invalid dependency (e.g., depends on nonexistent task "1.99"), it will wait forever with no timeout.

**Example failure:**
```
Task 2.5: depends on ["1.8", "1.99"]  # 1.99 doesn't exist

Phase 2 execution:
- get_ready_tasks() checks: is "1.99" in completed? → No
- Task 2.5 never becomes ready
- Orchestrator loops forever, checking same tasks repeatedly
- No timeout, no error surfaced to user
```

**Impact:** Silent hang, orchestrator stuck in infinite loop, wastes hours before user notices.

**Recommendation:** Add stuck detection:
```python
# In orchestrator main loop
MAX_ITERATIONS_WITHOUT_PROGRESS = 10
iterations_since_progress = 0

while phase_has_pending_tasks():
    ready = get_ready_tasks(phase_tasks, completed)

    if len(ready) == 0:
        iterations_since_progress += 1
        if iterations_since_progress >= MAX_ITERATIONS_WITHOUT_PROGRESS:
            # No progress in 10 iterations = stuck
            pending = [t for t in phase_tasks if t.status == "pending"]
            raise StuckStateError(
                f"No progress after {MAX_ITERATIONS_WITHOUT_PROGRESS} iterations. "
                f"Pending tasks: {[t.id for t in pending]}. "
                f"Check for missing dependencies or circular deps."
            )
        sleep(5)  # Brief wait before retry
    else:
        iterations_since_progress = 0  # Reset counter
        execute_ready_tasks(ready)
```

Also validate dependencies upfront:
```python
def validate_dependencies(all_tasks):
    """Check all dependencies exist before starting"""
    task_ids = {t.id for t in all_tasks}
    for task in all_tasks:
        for dep in task.depends:
            if dep not in task_ids:
                raise InvalidDependencyError(
                    f"Task {task.id} depends on nonexistent task {dep}"
                )
```

---

### [High] Ralph-loop output parsing assumes specific format without fallback

**Location:** Ralph Loop Integration section (lines 301-409)

**Issue:** The regex parser `parse_ralph_output()` assumes ralph-loop returns text with `[Critical]`, `[High]` tags. If ralph-loop format changes or returns unexpected output, parser fails silently and returns empty list, which is interpreted as "clean" (no issues).

**Example failure:**
```python
# Ralph-loop returns:
"Error: Unable to review artifact - file not found"

# Parser extracts: []  (no matches)
# Orchestrator interprets: No issues, proceed to next phase

# Reality: Review didn't run, quality gate skipped
```

**Impact:** False negatives, silently skip quality gates, ship buggy code.

**Recommendation:** Add robust error handling:
```python
def parse_ralph_output(output_text):
    """Extract severity + issues from ralph-loop output"""
    if not output_text or len(output_text.strip()) < 10:
        raise RalphParseError("Ralph-loop returned empty or invalid output")

    # Check for error patterns
    error_patterns = ["error:", "failed:", "unable to", "exception:"]
    if any(p in output_text.lower() for p in error_patterns):
        raise RalphExecutionError(f"Ralph-loop failed: {output_text[:200]}")

    issues = []
    pattern = r'\[(Critical|High|Medium|Low)\] (.+?)(?=\n- |\n\[|\Z)'

    matches = list(re.finditer(pattern, output_text, re.DOTALL))

    if len(matches) == 0:
        # No issues found - could be clean OR bad format
        # Check for "Review complete" or similar success indicator
        if "review complete" in output_text.lower() or "no issues" in output_text.lower():
            return []  # Actually clean
        else:
            # Unexpected format - treat as error
            raise RalphParseError(
                f"Ralph output doesn't match expected format. "
                f"Output preview: {output_text[:200]}"
            )

    for match in matches:
        severity = match.group(1)
        description = match.group(2).strip()
        issues.append({
            "severity": severity,
            "description": description
        })

    return issues
```

Also add explicit ralph output validation to Open Questions section.

---

### [Medium] Task executor could commit broken code if tests pass but acceptance criteria aren't actually met

**Location:** Task Executor Agent section (lines 85-123)

**Issue:** The TDD protocol states "Write tests → Implement → Validate acceptance criteria → Commit" but doesn't specify how to validate acceptance criteria beyond "tests pass". Tests might be incomplete or wrong.

**Example:**
```
Task 2.5: Implement Jina Reader client
Acceptance criteria:
- GET https://r.jina.ai/{url} with API key
- 10s timeout enforced
- Returns extracted text

Task executor writes test:
```python
def test_jina_success():
    result = jina_client.extract("url")
    assert result is not None  # Weak assertion
```

Test passes, but:
- Didn't verify API key is used
- Didn't verify 10s timeout
- Didn't verify actual text extraction

Executor commits anyway, says "acceptance criteria met ✓"
```

**Impact:** Commits code that doesn't fully meet requirements, ralph-loop may catch it later but wastes a full phase cycle.

**Recommendation:** Add acceptance criteria validation step:
```python
# In task executor after tests pass:
def validate_acceptance_criteria(task, implementation):
    """Parse acceptance criteria and verify each one"""
    criteria = task.acceptance_criteria.split('\n')
    unmet = []

    for criterion in criteria:
        criterion = criterion.strip('- ').strip()
        if not criterion:
            continue

        # Heuristics for verification
        if "timeout" in criterion.lower():
            # Check if timeout is set in code
            if "timeout=" not in implementation:
                unmet.append(f"No timeout set: {criterion}")

        if "api key" in criterion.lower():
            # Check if API key is used
            if "api_key" not in implementation and "Authorization" not in implementation:
                unmet.append(f"API key not used: {criterion}")

        # More heuristics as needed

    if unmet:
        return ValidationResult(
            passed=False,
            unmet_criteria=unmet,
            message="Some acceptance criteria not verified in code"
        )

    return ValidationResult(passed=True)
```

Note: This is heuristic-based for MVP. Full semantic verification is hard.

---

### [Medium] Checkpoint state doesn't track ralph-loop cycle count correctly for resume

**Location:** State Management & Checkpointing section (lines 412-467)

**Issue:** The checkpoint stores `ralph_cycles: {"1": 2, "2": 0}` but the resume logic doesn't use this information. When resuming from a checkpoint, ralph-loop will re-run from cycle 1, potentially hitting the same issues again.

**Example:**
```json
// Checkpoint after Phase 1 ralph cycle 2
{
  "phase": 1,
  "ralph_cycles": {"1": 2},
  "completed_tasks": [...]
}

// User pauses, then resumes
// Orchestrator starts Phase 2, invokes ralph-loop
// Ralph runs as "cycle 1" for Phase 2 (correct)

// But if Phase 1 is resumed (e.g., after fixing infrastructure issue):
// Orchestrator re-runs Phase 1 ralph-loop as "cycle 1" again
// Wastes time re-reviewing already-reviewed code
```

**Impact:** Inefficient use of ralph-loop, could waste 10-20 minutes re-reviewing already-clean phases.

**Recommendation:** Store ralph state per phase more explicitly and skip re-review if already clean:
```python
# Enhanced checkpoint
{
  "phase": 2,
  "ralph_cycles": {"1": 2, "2": 0},
  "ralph_clean": ["1"],  # Phases that passed ralph review
  "completed_tasks": [...]
}

# Resume logic
def should_run_ralph_review(phase_num, checkpoint):
    """Check if ralph review needed for this phase"""
    if str(phase_num) in checkpoint.get("ralph_clean", []):
        log_info(f"Phase {phase_num} already passed ralph review, skipping")
        return False

    cycles = checkpoint.get("ralph_cycles", {}).get(str(phase_num), 0)
    if cycles >= 3:
        log_warning(f"Phase {phase_num} hit max ralph cycles (3), skipping re-review")
        return False

    return True
```

---

### [Medium] No validation that plan.md phases match tasks.md phase numbering

**Location:** Orchestrator Agent section (lines 53-81), Integration Points (lines 636-724)

**Issue:** Design assumes plan.md has "Phase 1", "Phase 2", etc. and tasks.md has tasks "1.1", "2.1", etc. but provides no validation that these align. If tasks.md has tasks "3.1-3.5" but plan.md only defines Phases 1-2, orchestrator will try to execute Phase 3 that doesn't exist in plan.

**Example:**
```
plan.md:
- Phase 1: Foundation
- Phase 2: Core Pipeline

tasks.md:
- Task 1.1: ...
- Task 2.1: ...
- Task 3.1: ...  # Phase 3 not in plan!

Orchestrator:
- Executes Phase 1 ✓
- Executes Phase 2 ✓
- Tries Phase 3... no exit criteria in plan.md
- Phase validator fails (no criteria to check)
- Blocks with confusing error
```

**Impact:** Confusing failure mode, wastes time debugging mismatch.

**Recommendation:** Add upfront validation:
```python
def validate_plan_task_alignment(plan, tasks):
    """Ensure plan.md phases match tasks.md phase numbering"""
    plan_phases = set(range(1, len(plan.phases) + 1))
    task_phases = set(int(t.id.split('.')[0]) for t in tasks)

    missing_in_plan = task_phases - plan_phases
    missing_in_tasks = plan_phases - task_phases

    if missing_in_plan:
        raise ValidationError(
            f"tasks.md contains phases {missing_in_plan} not defined in plan.md"
        )

    if missing_in_tasks:
        log_warning(
            f"plan.md defines phases {missing_in_tasks} but no tasks in tasks.md"
        )
```

---

### [Medium] Task executor could hang if tests never pass (infinite retry loop)

**Location:** Task Executor Agent section (lines 100-103), Error Handling section (lines 477-501)

**Issue:** Error handling says "Test failures: Retry 1 time (2 attempts total)" but doesn't specify timeout for test execution. If tests hang (e.g., waiting for network response with no timeout), task executor hangs forever.

**Example:**
```python
# Task 2.5 test
def test_jina_timeout():
    # Test hangs waiting for API response (no timeout)
    result = jina_client.extract("https://slow-site.com")
    # Never returns

# Task executor runs test, waits forever
# Orchestrator waits for TaskUpdate, never receives it
# Entire execution pipeline hangs
```

**Impact:** Silent hang, orchestrator stuck waiting, no error surfaced.

**Recommendation:** Add test execution timeout:
```python
def execute_task_with_retry(task):
    """Execute task with 1 retry and timeout"""
    TEST_TIMEOUT = 300  # 5 minutes max per test run

    for attempt in range(1, 3):
        try:
            # Run tests with timeout
            result = run_with_timeout(
                lambda: task_executor.execute(task),
                timeout=TEST_TIMEOUT
            )
            return result

        except TimeoutError:
            if attempt == 2:
                return TaskResult(
                    status="BLOCKED",
                    reason=f"Tests timed out after {TEST_TIMEOUT}s (2 attempts)"
                )

        except TestFailure as e:
            if attempt == 2:
                return TaskResult(status="BLOCKED", reason="Tests failing after 2 attempts", error=e)

    return TaskResult(status="BLOCKED", reason="Max retries exceeded")
```

---

### [Medium] Parallel task executors could write to same files if grouping heuristic fails

**Location:** Parallelization Strategy section (lines 258-298), Risk Assessment R3 (lines 839-842)

**Issue:** Design assumes "Sequential IDs heuristic naturally separates by module" but this isn't guaranteed. If two tasks in different groups both modify the same file (e.g., both add to `models.py`), git conflict occurs.

**Example:**
```
Group A: Task 2.3 (adds RaindropItem model to models.py)
Group B: Task 2.10 (adds URLNormalizer helper to models.py)

Both run in parallel, both:
1. Read models.py (same base)
2. Add their code
3. Try to commit

Result: Git conflict on models.py
```

**Impact:** Execution blocks with git conflict, requires manual resolution.

**Recommendation:** Add file conflict detection before spawning:
```python
def detect_file_conflicts(task_groups):
    """Check if any groups will modify same files"""
    file_to_groups = {}

    for i, group in enumerate(task_groups):
        for task in group:
            # Extract affected files from task description/acceptance criteria
            files = extract_affected_files(task)
            for f in files:
                if f not in file_to_groups:
                    file_to_groups[f] = []
                file_to_groups[f].append(i)

    conflicts = {f: groups for f, groups in file_to_groups.items() if len(groups) > 1}

    if conflicts:
        log_warning(f"File conflicts detected: {conflicts}")
        # Force sequential execution for conflicting groups
        return merge_conflicting_groups(task_groups, conflicts)

    return task_groups
```

Note: This requires tasks.md to specify affected files (or infer from description).

---

### [Low] Fix task ID numbering could collide with future planned tasks

**Location:** Ralph Loop Integration section, Fix task generation (lines 374-396), Open Question 3 (line 900)

**Issue:** Fix tasks are numbered incrementally (1.14, 1.15 after 1.13) but if tasks.md originally planned tasks 1.14-1.20 for a future phase, fix tasks collide with planned IDs.

**Example:**
```
tasks.md (original):
- Task 1.1-1.13: Phase 1 (Foundation)
- Task 1.14-1.20: Reserved for Phase 1 extended work

Phase 1 completes, ralph finds 2 High issues
→ Create fix tasks 1.14, 1.15

But 1.14-1.20 were already planned!
→ ID collision, confusion
```

**Impact:** Low severity (rare in practice) but could cause confusion, breaks tasks.md structure.

**Recommendation:** Use prefixed IDs for fix tasks:
```python
def create_fix_tasks(issues, severity, phase_num):
    """Auto-generate fix tasks with F prefix"""
    fix_tasks = []
    fix_counter = get_next_fix_counter(phase_num)  # F1, F2, etc.

    for i, issue in enumerate([iss for iss in issues if iss["severity"] == severity], start=fix_counter):
        task_id = f"{phase_num}.F{i}"  # e.g., "1.F1", "1.F2"

        fix_task = {
            "id": task_id,
            "description": f"Fix: {issue['description']}",
            ...
        }

        fix_tasks.append(fix_task)

    return fix_tasks
```

Alternatively, start from 100: "1.101", "1.102" (unlikely to collide).

---

### [Low] No mechanism to persist run log if process crashes

**Location:** Traceability System section (lines 560-633)

**Issue:** Run log is written to `output/runs/{uuid}.log` but if Python process crashes (OOM, segfault, kill signal), logs may be buffered and lost.

**Example:**
```
Orchestrator runs for 2 hours, generates extensive run log
Python process killed by OOM killer
Run log file is empty or truncated (buffered writes lost)
User can't diagnose what happened before crash
```

**Impact:** Low severity (crashes rare) but troubleshooting is impossible when it does happen.

**Recommendation:** Use unbuffered logging or flush frequently:
```python
# Open log file with line buffering
log_file = open(f"output/runs/{run_id}.log", "w", buffering=1)

# Or flush after each log entry
def log_entry(level, message):
    entry = f"[{now()}] {level} {message}\n"
    log_file.write(entry)
    log_file.flush()  # Force write to disk immediately
```

---

### [Low] Phase completion commit could fail if no changes staged

**Location:** Integration Points, Git Operations (lines 716-723)

**Issue:** Phase completion commit uses `--allow-empty` flag which is correct, but design doesn't explain why. If implementer forgets flag, commit fails.

**Example:**
```bash
# All tasks already committed, no changes to stage
git commit -m "chore(phase-2): complete Phase 2"
# Error: nothing to commit, working tree clean

# Orchestrator interprets as commit failure
# Surfaces as blocker, stops execution
```

**Impact:** Low severity (easy to debug) but could confuse during implementation.

**Recommendation:** Add explicit note in design:
```bash
# Phase completion commit (MUST use --allow-empty)
# because all task changes already committed separately
git commit --allow-empty -m "chore(phase-2): complete Phase 2 - Core Pipeline

Tasks completed: 14
Commits: 14
Ralph-loop cycles: 1"
```

Also add comment in code template.

---

### [Low] Open Questions section could guide implementation ambiguity

**Location:** Open Questions for Review section (lines 894-911)

**Issue:** Several open questions lack clear recommendations, leaving ambiguity for implementer. For example, Q2 "What if all 14 tasks become ready?" doesn't provide a suggested answer.

**Impact:** Low severity but could slow implementation as developer needs to make decisions that should be in design.

**Recommendation:** Answer open questions or provide recommendations:

**Q1 (Ralph format):** Should be resolved by [High] issue above - add explicit format validation and error handling.

**Q2 (Task grouping):** If all 14 tasks ready, group into ceil(14/4) = 4 groups of 3-4 tasks each. Limit to first 5 groups.

**Q3 (Fix task numbering):** Use prefix "F" as recommended in [Low] issue above.

**Q4 (Exit criteria format):** Natural language is fine for MVP, add YAML structure in post-MVP if needed.

**Q5 (Checkpoint granularity):** Phase-level sufficient for MVP, reassess after real-world usage.

**Q6 (Error retry):** 1 retry (2 attempts) is appropriate for MVP, can increase later if flakiness observed.

**Q7 (Max parallel):** Start with 3 (conservative), increase to 5 if no context issues observed.

**Q8 (Ralph cycles):** 3 cycles is reasonable, matches typical review patterns.

---

## YAGNI Compliance Analysis

**Strengths:**
- ✅ Simple dependency resolution (no unnecessary DAG library)
- ✅ Phase-level checkpointing (not over-engineered task-level)
- ✅ Simple retry policy (no exponential backoff complexity)
- ✅ Sequential ID heuristic (no manual group annotations)

**Concerns:**
- ⚠️ Three-layer traceability might be overkill for MVP (git log + run log might be enough, defer session log to post-MVP)
- ⚠️ Phase validator agent might be complex for MVP (could start with simpler bash script validation)

**Overall:** Design is appropriately scoped for MVP, avoids over-engineering.

---

## Design Pattern Validation

**Centralized orchestration (LangGraph pattern):** ✅ Appropriate for 66-task scale

**DAG dependency resolution (Airflow/Bazel):** ✅ Well-researched, correctly applied

**Phase-level checkpointing (Temporal.io):** ✅ Good balance of safety vs overhead

**Parallel execution (GitHub Actions):** ✅ Matches research, 3-5 parallel is reasonable

**TDD enforcement:** ✅ Clear red→green→commit workflow

**Error handling:** ✅ Fail-fast strategy appropriate for automation

**Overall:** Patterns are well-chosen and correctly applied.

---

## Integration Points Validation

**ACM MCP Server:** ✅ Correctly uses get_stage, get_review_prompt, check_project_health

**Ralph Loop Plugin:** ⚠️ Assumes specific output format (addressed in [High] issue)

**Task Tools:** ✅ Proper use of TaskCreate, TaskUpdate, TaskList

**Git Operations:** ✅ Atomic commits, proper templates, Co-Authored-By

**Overall:** Integration points are sound with one format assumption issue.

---

## Risk Mitigation Analysis

**High Risks (R1-R3):** Mitigations are reasonable, fallbacks make sense

**Medium Risks (R4-R6):** Adequately addressed, acceptable for MVP

**Low Risks (R7-R8):** Minor issues, acceptable risk level

**Missing Risks:**
- Stuck state detection (now covered in [High] issue)
- Ralph output format brittleness (now covered in [High] issue)
- Test execution timeout (now covered in [Medium] issue)

**Overall:** Risk assessment is thorough, with gaps now identified.

---

## Success Criteria Evaluation

**MVP criteria:** ✅ Clear, testable, achievable

**Full feature criteria:** ✅ Measurable (time, commits, tests)

**Validation approach:** ✅ Using real project (link-triage-pipeline) is excellent

**Recommendation:** Success criteria are well-defined, should remain as-is.

---

## Implementation Phases Review

**7-phase breakdown:** ✅ Logical progression, each phase builds on previous

**Exit criteria per phase:** ✅ Clear validation points

**Timeline:** 7 weeks total - reasonable for MVP to production

**Recommendation:** Phase breakdown is solid, suggests good planning.

---

## Recommendations Summary

**Must address before implementation (High):**
1. Fix task grouping algorithm to handle non-sequential IDs
2. Add stuck state detection with timeout
3. Add robust ralph-loop output parsing with error handling

**Should address during implementation (Medium):**
4. Add acceptance criteria validation heuristics
5. Store and use ralph-loop clean status in checkpoint
6. Validate plan.md/tasks.md phase alignment upfront
7. Add test execution timeout
8. Add file conflict detection for parallel groups

**Consider for post-MVP (Low):**
9. Use prefixed IDs for fix tasks (F1, F2)
10. Use unbuffered logging for crash recovery
11. Document --allow-empty flag for phase commits
12. Resolve open questions with recommendations

---

## Approval Status

**Status:** ✅ **APPROVED FOR IMPLEMENTATION** with High issues addressed first

**Next Steps:**
1. Address 3 High issues (task grouping, stuck detection, ralph parsing)
2. Proceed to Phase 1 implementation (Core Orchestrator)
3. Test on link-triage-pipeline Phase 1
4. Address Medium issues as encountered during implementation
5. Defer Low issues to post-MVP

**Overall Quality:** Design is research-backed, well-structured, and appropriately scoped for MVP. High issues are fixable with ~50-100 lines of additional code. Recommended to proceed.

---

## End of Review - Cycle 1
