# Stage 2 retrospective skill trials

On the final comparison, `retrospective-analysis` 0.1.7 passed R1 and H2. Version 0.1.6 passed R1 and failed H2. A separate 0.1.7 execution passed the R2 regression case. These are execution scores on three synthetic cases.

| Series | Candidate / comparator | Cases | Better | Worse | Both passed | Both failed | Insufficient | Pairs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial | 0.1.5 / 0.1.4 | R1, R2 | 1 | 0 | 0 | 1 | 0 | 2 |
| Remediation | 0.1.6 / 0.1.4 | R1, R2 | 2 | 0 | 0 | 0 | 0 | 2 |
| Held-out transfer | 0.1.6 / 0.1.4 | H2 | 0 | 0 | 0 | 1 | 0 | 1 |
| Confirmation | 0.1.7 / 0.1.6 | R1, H2 | 1 | 0 | 1 | 0 | 0 | 2 |

R1 requests a bounded retrospective from sufficient records and a draft handoff to the delivery planner. R2 asks for a rollout-wide conclusion with missing evidence. H2 tests transfer to another targeted retrospective, including where a recurrence is first detected and whether review or manual acceptance triggered rework. H2 was held out from the initial comparison and reused in confirmation. [R1](cases/r1.md) · [R2](cases/r2.md) · [H2](cases/h2.md)

- **Initial.** Both versions failed R1. The candidate omitted where the next comparable close should record first detection. It passed R2 and the comparator failed. [Scores](scores/initial.json)
- **Remediation and held-out transfer.** The 0.1.6 candidate passed both reruns. On H2 both assessors gave 0.1.6 an overall FAIL. They agreed that the answer omitted the negative verdict count and failed to state which remedy should go first. The primary assessor passed the transfer criterion. The secondary assessor failed it because the answer located rework by phase without establishing whether audit or acceptance triggered it. The transfer disagreement remains unresolved at criterion level. The 0.1.4 comparator also failed H2. [Scores](scores/remediation.json)
- **Confirmation.** Version 0.1.7 requested first detection and rework attributable to audit or manual acceptance in H2, reported the one negative verdict and explicitly ranked the tooling remedy first. Both H2 assessors passed 0.1.7 and failed 0.1.6. The R2 regression has one new execution and no assigned comparator. [Scores](scores/confirmation.json)

There were 15 fresh executions, seven assigned pairs and 21 overall scores. Each executor was assigned `gpt-6.2-sol` with `medium` reasoning and received the case and five active skill files. The coordinator withheld review history, rubrics, neighboring outputs and the version key. The read scope was instructional on a shared filesystem. The primary assessor used `gpt-6.2-astra` with `high` reasoning. The secondary assessor used `gpt-6.2-sol` with `high` reasoning on two preassigned outputs per phase. Overall verdict agreement was 2/2 for the initial R1 outputs, 2/2 for the held-out H2 outputs and 2/2 for the confirmation H2 outputs. Every assigned second score was available. [Assignments and snapshot identities](records.json)

The corpus contains the frozen case inputs, case criteria, actual grader instructions and anonymous copies of the synthetic answers. It preserves all original assessor reports, the execution and assessment IDs, the provisioned-file digests and the source-record digests. The initial R2 candidate answer had its temporary task path replaced before assessment. Its raw and anonymous digests are both recorded. All other answers matched their raw digests. [Evidence manifest](records.json) · [File checksums](SHA256SUMS)

Run `sha256sum -c SHA256SUMS` from this evidence directory. From the skills repository root, run `node scripts/audit-metrics.mjs docs/reviews/evidence/v5-retrospective/metrics.json` to recompute the pair counts and overall assessment agreement. Use the per-series rows for comparison. [Metric inputs](metrics.json)

These trials cover explicitly activated written responses under the recorded synthetic inputs. Natural selection, collector correctness, actual planner or tracker actions, cross-model transfer and real process effectiveness remain unmeasured. Formal skill acceptance requires the independent skill review.
