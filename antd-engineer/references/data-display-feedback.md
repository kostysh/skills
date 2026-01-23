# Data Display & Feedback Cases

Use this file when the user asks about **tables/lists**, **empty states**, or **feedback messaging**.

## Case 1: Structured data with sorting/filtering

**Context**: Dense data with columns, sorting, and pagination.
**Decision**: Use `Table`; prefer server-side pagination for large datasets.
**Why**: Table supports sorting/filtering patterns out of the box.
**Docs**:
- `https://ant.design/docs/spec/data-display`
- `https://ant.design/components/table`

## Case 2: Simple list with avatars and metadata

**Context**: Feed or directory.
**Decision**: Use `List` with `Avatar`, `Tag`, and `Badge` as needed.
**Why**: List is lighter than Table and more flexible.
**Docs**:
- `https://ant.design/docs/spec/data-display`
- `https://ant.design/components/list`
- `https://ant.design/components/avatar`

## Case 3: Empty or no‑results state

**Context**: Search returns nothing or initial empty view.
**Decision**: Use `Empty` for neutral states; use `Result` for success/error outcomes.
**Why**: Distinguishes between absence of data vs outcome messaging.
**Docs**:
- `https://ant.design/components/empty`
- `https://ant.design/components/result`

## Case 4: User feedback scope

**Context**: Need to notify user of actions.
**Decision**: Use `Message` for brief transient info; `Notification` for richer, global context; `Alert` for inline persistent guidance.
**Why**: Different scopes prevent overuse of modal feedback.
**Docs**:
- `https://ant.design/docs/spec/feedback`
- `https://ant.design/components/message`
- `https://ant.design/components/notification`
- `https://ant.design/components/alert`

## Case 5: Very large datasets

**Context**: Thousands of rows or frequent updates.
**Decision**: Use server-side pagination or Table virtual list; avoid rendering huge datasets in the browser.
**Why**: Prevents performance and memory issues.
**Docs**:
- `https://ant.design/components/table`

## Case 6: Read‑only detail view

**Context**: Entity details with labeled fields.
**Decision**: Use `Descriptions` and `Statistic` instead of a table.
**Why**: Improves readability and hierarchy.
**Docs**:
- `https://ant.design/components/descriptions`
- `https://ant.design/components/statistic`

## Case 7: Destructive action confirmation

**Context**: Delete/archive actions.
**Decision**: Use `Popconfirm` for quick, inline confirmation; use `Modal` when additional context is required.
**Why**: Reduces friction while preserving safety.
**Docs**:
- `https://ant.design/components/popconfirm`
- `https://ant.design/components/modal`

## Case 8: Loading and skeletons

**Context**: Page or card sections fetch data.
**Decision**: Use `Skeleton` for layout placeholders, `Spin` for small local loads.
**Why**: Skeletons preserve layout and reduce perceived latency.
**Docs**:
- `https://ant.design/components/skeleton`
- `https://ant.design/components/spin`
