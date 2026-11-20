# Decision register

## D-001 — Wording for an unknown save error

- Status: Awaiting confirmation in the solo batch. This uses the one available slot.
- Owner and source: The solo project owner directed reuse of the existing wording under the approved solo decision policy.
- Class: Reversible generic internal error wording.
- Choice: Use “Save failed” when the save service returns an unknown error. The message contains no personal data.
- Impact and reversal: The message tells the user that the save failed. Changing it requires a copy edit and an update to this record.
- Dependent work: Any later implementation of this fallback should use the confirmed wording. See the [morning handoff](morning.md#d-001--wording-for-an-unknown-save-error).
