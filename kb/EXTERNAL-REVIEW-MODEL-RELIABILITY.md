# External Review Model Reliability

Tracking log for review iteration learnings. Goal: tune the review function through 10-20 real reviews (week of 2026-02-01).

## Tuning Targets

After each review, log observations below and check whether any of these need adjustment:

| Target | File | What to tune |
|--------|------|-------------|
| External model prompts | `prompts/{stage}-external-review-prompt.md` | Prompt clarity, false positive triggers, severity calibration |
| External ralph prompts | `prompts/{stage}-external-ralph-prompt.md` | Orchestration instructions, synthesis quality, stop conditions |
| Internal review prompts | `prompts/{stage}-ralph-review-prompt.md` | Coverage, YAGNI enforcement, severity thresholds |
| Review spec | `ACM-REVIEW-SPEC.md` | Cycle rules, severity definitions, stop conditions |
| Model config | `~/.claude/models.yaml` | Model selection, pricing, extra_params tuning |
| Single-model warning | `acm-review/commands/artifact-external.md` | Threshold for warning, default model count |

## Per-Model Observations

### Gemini
- ~20% false positive rate (1/5 issues, hallucinated nonexistent field) — sample size: 1 review
- Hallucination type: referencing artifact sections/fields that don't exist

### GPT
- (No data yet)

### Kimi-K2
- (No data yet)

## Pattern Log

Patterns that emerge across multiple reviews. Update as data accumulates.

| Pattern | Occurrences | Action Taken |
|---------|-------------|-------------|
| Single-model false positives | 1 | Added single-model warning to artifact-external command |
| Shell pipe corruption in prompts | 1 | Added --prompt-file to ralph-loop |
| (add as patterns emerge) | | |

## Review Iteration Log

Log every review here. One row per review invocation.

| # | Date | Project | Stage | Phase | Models | Cycles | Issues Found | False Positives | True Positives | Action Items |
|---|------|---------|-------|-------|--------|--------|-------------|----------------|---------------|-------------|
| 1 | 2026-02-01 | ACM | Design | External | Gemini | 1 | 5 | 1 (hallucinated field) | 4 | Added single-model warning, --prompt-file |
| | | | | | | | | | | |

## Recommendations (living)

- Default to 2+ models for external review
- Treat single-model structural claims with higher scrutiny
- After 5 reviews: reassess severity calibration in prompts
- After 10 reviews: consider model-specific prompt tuning if patterns diverge
- After 20 reviews: publish tuned defaults and archive this tracking log
