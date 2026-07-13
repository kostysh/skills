Before finishing:

- verify that every required reference is linked from `SKILL.md`
- verify that supporting docs remain clearly non-normative
- verify instruction quality: outcome-first instructions, no unresolved contradictions, precise reference/tool triggers, validation gates, and stop rules; report `blocked: unresolved-conflict` if this cannot be established
- report this instruction-quality result as an author self-check; route formal independent skill-capability review to skill-reviewer
- verify that copied assets and runtime files are reachable by relative path; include tests in the emitted package only when they are intentionally shipped and independently runnable there
- verify that the generated bundle can be copied to another machine without losing required behavior
- verify that compilation used a new resolved output skill directory and did not replace an existing target
- report CLI results as structural and portability evidence only, never as proof of semantic or behavioral `PASS`
