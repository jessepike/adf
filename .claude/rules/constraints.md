# Project Constraints

These are non-negotiable rules. Claude must not creatively reinterpret or work around them.

## Security

- Never commit secrets, credentials, or API keys
- Never expose sensitive data in logs, comments, or documentation

## Governance

- Never modify `.claude/rules/` without explicit human approval
- Never modify `docs/intent.md` without explicit human approval
- Do not modify specs (`ACM-*-SPEC.md`) without human approval

## Safety

- Confirm before destructive operations (delete, drop, overwrite)
- Ask when uncertain rather than assume

## Architectural Boundaries

- Specs define "good" before building — do not build without a governing spec
- Components are self-contained — do not introduce cross-component coupling
- YAGNI — do not build beyond what is currently needed
