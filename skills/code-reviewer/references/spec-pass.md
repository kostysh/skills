# Lightweight Spec Pass

Use this pass when a review has a linked issue, acceptance criteria, API contract, ADR, migration note, or other normative source, but the user did not ask for a full implementation-vs-spec audit.

## Goal

Catch intent drift early without turning every PR review into full requirement traceability.

## Steps

1. Fix the normative inputs:
   - list the sources actually available
   - note whether you are relying on a formal source, a linked issue, or only user intent
   - if sources conflict or are incomplete, reduce confidence instead of guessing
2. Extract three to seven concrete "must" statements:
   - required behavior
   - required error or contract behavior
   - compatibility, migration, flag, or rollout expectations when relevant
3. Compare the diff against those statements:
   - aligned
   - partially aligned
   - contradicted
   - not verifiable from current evidence
4. Check for significant behavior with no clear requirement basis:
   - contract widening
   - changed defaults or fallback semantics
   - silent coercion or error suppression
   - new side effects
5. Decide whether to stay in `code-reviewer` or escalate.

## Output Rules

- Do not build a full traceability matrix unless the user asked for one.
- If a finding is spec-driven, cite the source and the required behavior.
- If normative sources are missing, say the pass was based on linked issue, acceptance criteria, or user intent.
- Put low-confidence mismatches into open questions or assumptions instead of findings.

## Escalate to `spec-conformance-reviewer` When

- the user explicitly asks for implementation-versus-spec review
- multiple normative documents exist or the documents conflict
- contracts, state transitions, migrations, backward compatibility, or flags are central to the change
- a requirement-by-requirement verdict is needed
- evidence gaps or ambiguous sources are the main risk
