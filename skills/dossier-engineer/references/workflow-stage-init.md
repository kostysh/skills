# Workflow stage steps: `init`

1. Check for `docs/architecture/system.md`.
2. If missing, search for plausible repo-level architecture docs under `docs/`.
3. If no architecture exists, stop without partial bootstrap.
4. If exactly one clear candidate exists, move or rename it to `docs/architecture/system.md`.
5. Ensure `docs/features/` and `.dossier/` directories exist.
6. If the repository chooses embedded dossier automation, provision repo-local scripts or wrappers when safe and report exactly which commands and paths were created.
   The shipped skill runtime itself remains `node scripts/dossier.mjs <command>` inside this skill package; do not imply that bootstrap automatically creates a repo-local `scripts/dossier.mjs` unless the bootstrap report explicitly says it did.
7. Create or normalize `docs/ssot/index.md`.
8. Create or update repo-root `AGENTS.md` as an overlay-only file.
9. Re-read architecture and surface day-1 implementation invariants that future modes must preserve.
10. Report created, moved, renamed, normalized, and untouched artifacts separately.
