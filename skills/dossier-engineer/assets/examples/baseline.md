---
artifact_type: baseline
schema_version: "2.2"
id: BASE-20260430-existing-product-a17c92
title: Existing product baseline
mode: existing-project
source_refs:
  - SRC-20260430-product-concept-a17c92
capabilities:
  - capability_id: CAP-20260430-auth-login-a17c92
    status: observed
    evidence:
      - docs/evidence/login-demo.md
    added_at: "2026-04-30T12:30:00Z"
    notes: Login was demonstrated through the production-like UI flow.
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:30:00Z"
---

# Existing product baseline

## Scope

This baseline records behavior that already works when the dossier workflow is introduced.

## Observed capabilities

- `CAP-20260430-auth-login-a17c92` — the user can log in through the UI flow.

## Assumed or unverified capabilities

None.

## Evidence notes

Evidence is stored in `docs/evidence/login-demo.md`.

## Gaps

None.
