# Authoring guidelines

This reference distills practical guidance from the Agent Skills specification and OpenAI's Build Skills guide. External pages are optional provenance; the local rules below remain sufficient when the skill folder is copied offline.

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

## Instruction quality audit

Strong agent instructions define the desired outcome and operating boundaries, then leave implementation freedom where multiple safe paths are valid.

This compiler workflow is an author-side structural and instruction-quality self-check. It can expose missing contracts, contradictions, hidden guidance, and unjustified surfaces, but compiler success does not prove that realistic prompts produce correct skill behavior. For a formal independent verdict on a new or substantially changed skill, route the stable generated snapshot to `skill-reviewer`; use blind forward-tests when the change can affect agent decisions, actions, handoffs, validation, stop rules, or reporting.

Audit every new or substantially changed skill against these model-agnostic traits:

| Instruction trait | Skill authoring implication |
| --- | --- |
| Outcome execution | State the user-visible goal, success criteria, allowed side effects, evidence rules, and final output shape. |
| Literal rule application | Remove contradictions, duplicated rules, and vague precedence. If two rules can conflict, say which one wins. |
| Right-sized freedom | Avoid long step-by-step process scripts unless the exact sequence is required for safety, correctness, or a fragile tool. Prefer decision criteria and validation gates. |
| Precise tool use | Put tool-specific rules near the tool or command description: when to use it, required inputs, side effects, retry safety, and expected outputs. |
| Long-running orchestration | Be explicit about codebase inspection, reuse of local conventions, validation commands, acceptance criteria, and when to ask or stop. |
| Retrieval discipline | Give concrete reference triggers and stopping conditions so agents load only the smallest useful reference set. |
| Direct output style | Specify tone, Markdown, length, and section shape only when the product or workflow needs them. |
| Tool-backed self-checking | Require concrete checks where possible; if validation cannot run, require the agent to report the gap and the next-best check. |
| Observable surface | Add commands, modes, metrics, configuration knobs, and active references only when they change current agent behavior and can be backed by runtime behavior, measured evidence, or active guidance. |

For skills, this usually means:

- `Start here` names the first decision and the minimum context to inspect.
- `Workflow stages` describe outcomes, constraints, and validation, not every obvious micro-action.
- `Reference Navigation` says exactly when to load each reference.
- `Gotchas` contain high-impact failure modes, not generic advice.
- `Policies` define precedence, side-effect limits, evidence rules, and stop conditions.
- `Output contract` says what the final answer must include when that matters.

Do not add placeholder surfaces for future flexibility. A command must be exposed by the runtime, a mode must change an agent decision path, a metric must come from measured data or be labeled as a qualitative check, and a reference must carry active guidance that is worth retrieving separately.

Do not add model-version lore to domain skills. Keep these traits as an authoring gate; only domain-relevant consequences should appear in generated skill text.

## Description quality

The `description` field is the trigger surface and is loaded before the rest of the skill. Keep it:

- imperative: tell the agent when to use the skill
- focused on user intent, not internal implementation
- concise: a few sentences to a short paragraph
- no more than the recommended 300 Unicode code points after YAML parsing and trimming

The compiler emits a warning, not an error, above this recommendation. Astral characters such as emoji count as one code point; combining marks count separately. When refining a description, test both should-trigger and should-not-trigger prompts so you do not broaden it blindly.

## Specification alignment

- Keep the folder name and frontmatter `name` identical and within the Agent Skills naming constraints.
- Keep core instructions in `SKILL.md`; use `references/`, `scripts/`, and `assets/` as progressively disclosed resources.
- Treat additional frontmatter metadata as compatibility-sensitive. The compiler emits only its supported contract and keeps source-version under `metadata`.
- Design descriptions around realistic user intents, then test positive, negative, and near-boundary prompts. A structurally valid package is not evidence that activation behavior is reliable.

Optional provenance:

- OpenAI Build Skills: <https://learn.chatgpt.com/docs/build-skills>
- Agent Skills specification: <https://agentskills.io/specification>

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
