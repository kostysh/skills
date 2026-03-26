# Security Review Methodology

Use this file for the common workflow, regardless of stack.

## Review Standard

Report only findings that survive all of these checks:

1. **Attacker control**: the attacker controls input, identity, trigger, or reachable code path.
2. **Reachability**: the vulnerable path can actually execute in the reviewed context.
3. **Mitigation check**: no surrounding validation, escaping, parameterization, access control, or deployment boundary already neutralizes it.
4. **Impact**: the outcome matters for confidentiality, integrity, availability, or privilege.

If any link is weak, downgrade the concern.

## Confidence Rubric

| Level | Meaning | Action |
|---|---|---|
| HIGH | full exploit chain or missing control is demonstrated from the reviewed code | report |
| MEDIUM | strong signal, but one trust-boundary or mitigation question is unresolved | "needs verification" only |
| LOW | theoretical, cosmetic, or obviously mitigated | do not report |

## Evidence Checklist

For every reported finding, prove:

- where attacker-controlled data comes from
- where it reaches a dangerous sink or missing permission check
- why framework defaults do not already make it safe
- what attacker outcome becomes possible

## Common False Positives

Do not flag these without stronger context:

- constants or deployment config treated as attacker-controlled
- framework-autoescaped template output
- parameterized ORM or query builder usage
- privileged-only flows where the same privilege is required to exploit the path
- test-only helpers or dead code

## Default Output

```markdown
[high] `path/to/file.ts:42` Short title
Confidence: HIGH
Impact: what an attacker gains
Evidence: attacker input -> vulnerable path -> effect
Fix: the safest remediation direction
```

If needed:

```markdown
Needs verification
- `path/to/file.ts:99` Short note on what remains unclear
```

## Review Close-Out

Before finalizing:

- ensure all reported findings are high confidence
- ensure each finding names a concrete attacker outcome
- drop anything that is really just a best-practice suggestion
- keep medium-confidence items separate from confirmed findings
