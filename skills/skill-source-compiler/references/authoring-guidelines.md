# Authoring guidelines

This reference distills practical guidance from the Agent Skills specification and the public authoring guides.

## SKILL.md scope

Keep `SKILL.md` as the core instructions the agent needs on every activation:

- activation criteria
- default workflow
- short gotchas
- links to focused reference files

Do not pack every edge case into the root file. Move detailed material into `references/*` and tell the agent when to load each file.

## Recommended size

External guidance recommends keeping the main `SKILL.md` under:

- 500 lines
- about 5000 tokens

For a rough byte-based approximation, this skill treats `~20000` UTF-8 bytes as a practical default ceiling because `5000` tokens is commonly close to `~4` bytes per token for English-heavy Markdown and code samples. This is only an approximation; use `skill.recommended-skill-md-max-bytes` as a warning threshold, not an exact tokenizer substitute.

## Progressive disclosure

Use `references/*` for:

- long explanations
- provider-specific or framework-specific variants
- extended examples
- conditional guidance that only applies in some flows

Write explicit load triggers in `SKILL.md`. A concrete rule like “Read `references/api-errors.md` if the API returns a non-200 status code” is better than a vague “see references for details.”

## Description quality

The `description` field is the trigger surface. Keep it:

- imperative: tell the agent when to use the skill
- focused on user intent, not internal implementation
- concise: a few sentences to a short paragraph
- within the spec limit of 1024 characters

When refining a description, test both should-trigger and should-not-trigger prompts so you do not broaden it blindly.

## Utility location

If a skill ships an executable utility, instruct the agent to look under `<skill-root>/scripts`. Do not assume the utility is globally installed or available on `PATH`.

Prefer explicit invocations from the skill root, for example:

```bash
node scripts/skill-source-compiler.mjs regenerate .
```

Use out-of-place compile only for independent packaging targets:

```bash
node scripts/skill-source-compiler.mjs compile . --out-dir ../compiled-skills
```
