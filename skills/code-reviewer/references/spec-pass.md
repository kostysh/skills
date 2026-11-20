# Lightweight Spec Pass

Use this pass for a review with a normative source or an adopted solo decision policy. Route a full implementation-versus-spec audit to `spec-conformance-reviewer`.

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

## Authority for solo decisions

When the project has adopted a solo decision policy, trace each material choice
in the diff to an accepted requirement, an explicit owner confirmation, or a
recorded delegated class that covers this exact choice. Check class exclusions,
capacity at the decision, pending status and the permission for the proposed
merge. Report an unrecorded or out-of-class material choice as an authority
finding under that policy even if the code works. A changed choice needs its
rework link and current-head verification before a dependent merge.

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
