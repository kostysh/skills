# Data Entry Cases

Use this file when the user asks about **form structure**, **input selection**, or **validation strategy**.

## Case 1: Standard business form

**Context**: CRUD form with validation and submit.
**Decision**: Use `Form` + `Form.Item` for layout and validation; prefer built-in controls.
**Why**: Centralized validation and consistent spacing.
**Docs**:
- `https://ant.design/docs/spec/data-entry`
- `https://ant.design/components/form`

## Case 2: Dense filter panel (search + filters)

**Context**: Data table with inline filters.
**Decision**: Use `Form` in `inline` layout; keep controls compact; use `Select`, `DatePicker`, `Input`.
**Why**: Inline layout communicates “filters” and saves space.
**Docs**:
- `https://ant.design/docs/spec/data-entry`
- `https://ant.design/components/form`
- `https://ant.design/components/select`
- `https://ant.design/components/date-picker`

## Case 3: Multi-step form with validation gate

**Context**: Wizard-like flow with required steps.
**Decision**: Use `Steps` for progress, separate `Form` instances per step, validate before moving forward.
**Why**: Prevent invalid state propagation across steps.
**Docs**:
- `https://ant.design/components/steps`
- `https://ant.design/components/form`

## Case 4: High-volume input (batch edit)

**Context**: Many fields, repeated structures.
**Decision**: Use `Form.List` for dynamic fields and `Collapse` or `Tabs` to group.
**Why**: Keeps the UI manageable while preserving validation.
**Docs**:
- `https://ant.design/components/form`
- `https://ant.design/components/collapse`
- `https://ant.design/components/tabs`

## Case 5: Dependent fields and conditional validation

**Context**: Field B appears only if Field A has a certain value.
**Decision**: Use `dependencies` or `shouldUpdate` on `Form.Item`; keep logic within the Form.
**Why**: Centralizes validation and avoids state mismatch.
**Docs**:
- `https://ant.design/components/form`

## Case 6: Large option sets with search

**Context**: Selection from hundreds or thousands of items.
**Decision**: Use `Select` with `showSearch` and async search; avoid loading all options at once.
**Why**: Improves performance and usability.
**Docs**:
- `https://ant.design/components/select`

## Case 7: File upload with validation and progress

**Context**: Upload files with size/type restrictions and progress feedback.
**Decision**: Use `Upload` with `beforeUpload` for validation and show progress; integrate with `Form` if part of a submission.
**Why**: Keeps validation consistent and provides clear user feedback.
**Docs**:
- `https://ant.design/components/upload`
- `https://ant.design/components/form`
