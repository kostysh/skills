# AGENTS.md

This directory is a backlog root managed by `@kostysh/backlog-engineer-cli`.

## Core rules

- Treat the utility as the source of truth for the current backlog state.
- Do not reconstruct current state by reading `packets/`, `patches/`, or `.backlog/*` directly.
- Do not edit `.backlog.json`, `.backlog/`, `reports/`, or canonical import copies manually.
- Canonical import copies are immutable after registration.
- Add new tasks only through `packet`.
- Change existing tasks only through patch-based commands.
- Remove existing tasks only through patch-based commands.
- Prefer scoped operations over global ones when the affected source or task is known.
- Use `--dry-run` for risky or large mutations before applying them for real.

## Command selection

- Use `search` when task keys are unknown or filtering is needed.
- Use `items` when task keys are already known and full task cards are needed.
- Use `refresh` when source documents may have changed.
- Use `queue` when you need to know what can be taken next.
- Use `attention` when you need tasks that require review or re-review.
- Use `gaps` when you need explicit blockers.
- Use `status` for a short summary in chat.
- Use `report` only when a report file on disk is explicitly needed.

## Source handling

- Read source documents first.
- Register sources through the utility before relying on them in packets.
- If multiple sources are needed for one backlog root, register them strictly one by one.
- Use utility lookups such as `list-sources` instead of rebuilding source mappings from packet files.

## Drafts vs canonical copies

- You may author draft packet and patch files in `packets/` and `patches/` before applying them.
- After apply, treat utility-owned canonical import copies as immutable.
- The existence of both a draft file and a canonical copy is intentional, not clutter.

## Mutation follow-up

- After `packet`, `patch-item`, `remove-item`, or `refresh`, trust the command result first.
- If the result reports new or updated `todo`, follow up only with `attention` or `items` for the returned task keys.
- If there are no `todo` changes and the operator asked only for the result, avoid extra reads.

## Working assumptions

- `gaps` means blocked.
- Open `todo` caused by source, dependency, or context change means review is needed.
- `ready_for_next_step = true` means the task can be taken further.
