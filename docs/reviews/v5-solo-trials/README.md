# Solo skill trial evidence

The coordinator froze the [primary cases and rubric](https://github.com/kostysh/development-methodology/blob/7de24bc/planning/v5/solo-forward-cases.md) before the instruction edits. Four fresh executors were assigned gpt-6.2-sol with high reasoning. Each received the supplied facts and one anonymous package. The assessors scored shuffled outputs before the coordinator revealed the assignments. The primary assessor was assigned gpt-6.2-astra high and the second gpt-6.2-sol high. Each output below is the original saved response.

| Assigned pair | Evaluated package | Baseline at 5f5b27c9 | Result |
| --- | --- | --- | --- |
| P1, morning handoff | [F13](F13.md), pass | [Q06](Q06.md), fail | Better |
| P2, reversal and review | [Q41](Q41.md), pass | [M87](M87.md), fail | Better |

The [primary scores](score-primary.md) cover four outputs. The [second assessor](score-second.md) agreed on both outputs assigned for double scoring. Counts for two distinct tasks were better 2, worse 0, both passed 0, both failed 0, insufficient 0. No repeats or production owner decisions were involved. The first candidate used requirements approval 0.2.5, code review 0.4.9, specification conformance 0.1.11 and retrospective 0.1.8.

After the independent source review, the coordinator froze a [local execution case](https://github.com/kostysh/development-methodology/blob/1a9e12b/planning/v5/solo-local-case.md). Two new gpt-6.2-sol high executors worked in separate local projects. A fresh assessor assigned gpt-6.2-sol medium scored their saved files before unblinding. The original 0.2.5 package produced [C81 register](C81-decisions.md) and [handoff](C81-morning.md). The corrected 0.2.6 package produced [J49 register](J49-decisions.md) and [handoff](J49-morning.md). Both passed this case. [Independent scores](local-scores.md). The instruction correction resolves a source contradiction. This additional pair did not show an improvement in the observed local task.

The [complete-evidence scores](local-full-scores.md) use the saved files and the unedited [C81 reply](C81-reply.txt) and [J49 reply](J49-reply.txt). The still-blind assessor recorded two passes. The earlier assessment covered files alone. Both scores address the same executions.
