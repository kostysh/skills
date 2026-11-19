# Stage 8 implementation-discipline trials

The independent review found a P2 in 0.2.10 and verified its correction in 0.2.11. The first review returned FAIL even though 0.2.10 passed both assigned synthetic cases. The confirmation pair shows that both versions completed the new launch case. The 0.2.11 PASS applies to the reviewed skill change and archive. [Initial review](review.md) · [Re-audit](review-0.2.11.md)

| Series | Candidate / comparison | Better | Worse | Both passed | Both failed | Insufficient | Assigned pairs |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial, I1 and I2 | 0.2.10 / 0.2.9 | 1 | 0 | 1 | 0 | 0 | 2 |
| Confirmation, H8 | 0.2.11 / 0.2.10 | 0 | 0 | 1 | 0 | 0 | 1 |
| All assigned pairs | | 1 | 0 | 2 | 0 | 0 | 3 |

| Case | Candidate | Comparison | Outcome |
| --- | --- | --- | --- |
| I1, switch between authorized tasks | [0.2.10 e0ff8680](outputs/i1-e0ff8680.md) PASS | [0.2.9 a0bbe55e](outputs/i1-a0bbe55e.md) FAIL | Better. 0.2.9 left the development log empty. |
| I2, resume with retained check results | [0.2.10 e37de62e](outputs/i2-e37de62e.md) PASS | [0.2.9 fea34916](outputs/i2-fea34916.md) PASS | Both passed. |
| H8, launch and retain evidence for the next operator | [0.2.11 50c1bc73](outputs/h8-50c1bc73.md) PASS | [0.2.10 c29354a9](outputs/h8-c29354a9.md) PASS | Both passed. An early launcher stopped before the validator ran in each arm. Both arms produced one actual validator invocation and durable receipts. |
| I2, regression | [0.2.11 7a96c271](outputs/i2-7a96c271.md) PASS | Unpaired | The trace shows both reconciliation inputs read before receipts. The first explicit comparison follows receipt reads. |

The coordinator assigned seven fresh executions on `gpt-6.2-sol` with medium reasoning. Each leg received the corresponding case and disposable workspace plus the three installed active files for its assigned version. The coordinator withheld the plan, history, rubric, version key and other executions. The access limits were instructional on a shared filesystem. Explicit activation exercises behavior after the skill is supplied. [I1 request](cases/i1.md) · [I2 request](cases/i2.md) · [H8 request](cases/h8.md) · [H8 brief](cases/h8-brief.md)

The primary assessors scored all seven anonymous outputs. The preassigned secondary assessors scored both I2 outputs in the initial series and both H8 outputs in confirmation, using the same criteria and evidence for each output. Agreement was 2/2 in each series and 4/4 overall. Missing scores and disagreements were both 0. The original scores are preserved byte-for-byte. [Initial criteria](criteria/assessor-packet.md) · [Initial primary scores](scores/primary.json) · [Initial secondary scores](scores/secondary.json) · [Confirmation criteria](criteria/confirmation-assessor-packet.md) · [Confirmation primary scores](scores/confirmation-primary.json) · [Confirmation secondary scores](scores/confirmation-secondary.json)

The public answers reproduce the original final answers with temporary workspace prefixes removed where present. Their synthetic fixture references are retained. The manifest binds each run to its starting and ending workspace records, provisioned-file record, anonymous grading input, original answer and original raw run record by SHA-256. It also records checked workspace changes and launch and receipt observations. Raw traces remain with the coordinator. [Study manifest](records.json) · [Metrics inputs](metrics.json) · [Original frozen procedure and I1/I2 criteria](criteria/frozen-extract.md) · [Frozen H8 rubric](criteria/h8-frozen.md) · [File checksums](SHA256SUMS)

I2 supplies a simulated resume event with a synthetic Git/CI snapshot and real local check receipts. H8 uses an actual local Git checkout and validator to verify that evidence lasts beyond the launcher. H8 has no observed real compaction or host restart. Natural selection, collector and hook behavior, live CI, cross-model transfer and delivery improvements remain outside the comparison. Methodology Stage 8 closure requires its own drills and pilot evidence.

Run `sha256sum -c SHA256SUMS` from this directory. From the skills repository root, run `node scripts/audit-metrics.mjs docs/reviews/evidence/v5-task-recovery/metrics.json` to recompute the pair counts, assessor agreement and available audit events.
