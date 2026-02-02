# External Review Model Reliability

## Observations

### Gemini (as of 2026-02)
- ~20% false positive rate observed (1 out of 5 issues was a hallucinated nonexistent field)
- Hallucination type: referencing artifact sections/fields that don't exist in the reviewed document

### General
- Single-model reviews lack cross-reviewer consensus, making false positives harder to catch
- Multi-model reviews (2+) allow disagreements to surface hallucinations

## Recommendations

- Default to 2+ models for external review when possible
- Treat single-model findings with higher scrutiny, especially structural claims
- Track false positive rates per model as data accumulates

## Data Log

| Date | Model | Artifact | Total Issues | False Positives | Notes |
|------|-------|----------|-------------|----------------|-------|
| 2026-02 | Gemini | design.md (ACM) | 5 | 1 | Hallucinated nonexistent field reference |
