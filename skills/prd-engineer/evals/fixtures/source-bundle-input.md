# Source bundle and draft PRD

The repository states that all four source items below are current, authoritative, and in scope. There are no precedence conflicts. The draft PRD is a newly generated non-authoritative artifact.

## Source A — contract prose

Locator `Contract §4.2`:

> The service must export a signed PDF within 60 seconds after an operator approves the report, except while the signing provider reports scheduled maintenance.

## Source B — policy table

Locator `Policy table 3`:

| Row | Condition | Obligation |
| --- | --- | --- |
| `T3-R1` | A report contains personal data | The export must include an access-event identifier. |
| `T3-R2` | An export fails after approval | The operator must receive a retry control and the failure reason. |

## Source C — decision email

Locator `Email 2026-06-18, decision D-17`:

The product owner decided that automatic retry is out of scope for the first release; retry must be initiated by the operator.

## Source D — approved mockup

Locator `Mockup Export v5, annotation M-8`:

The failure state keeps the approved report visible and places the retry control beside the failure reason.

## Draft PRD under review

Authority: non-authoritative

Intended handoff: delivery-planning

### Executive summary

Operators can export approved reports as signed PDF and recover from export failures.

### Requirements

- `R-1`: The service exports a signed PDF within 60 seconds after approval.
- `R-2`: Exports containing personal data include an access-event identifier.
- `R-3`: Failed exports expose a recovery action.

### Acceptance

- An approved report produces a signed PDF within 60 seconds.
- A failed export shows that recovery is available.

The draft contains no source reconciliation table and no explicit dispositions.
