# Queue preview
`previewReady(items)` receives valid records `{ id, title, ready }`.
`id` is a non-negative integer, including zero. `ready` is a boolean.
Return `{ id, title }` for every ready item, in the same order. Do not alter the inputs.
No record may disappear because of its numeric identifier.
Run the existing suite with `npm test`. The sample is a report from the local preview, not from a remote service.
