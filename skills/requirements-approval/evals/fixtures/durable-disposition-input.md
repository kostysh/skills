# Durable disposition assessment input

Repository rules allow a customer-decision record to close only when each accepted obligation has either a freshly verified owning artifact or code change, or a current linked follow-up that preserves the obligation, owner, activation trigger, acceptance or evidence, evidence-return route, and reciprocal link.

## Q-DIRECT

The authorized customer owner accepted a seven-day export-link lifetime. Change `chg-7day` is traced to that accepted obligation and changes the canonical specification from its prior authoritative state to contain the exact seven-day rule. Its required published ref and fresh readback are supplied, no affected owner or authority conflict remains, and the approval item is freshly observed in its accepted terminal state.

## Q-FOLLOWUP

The authorized customer owner accepted an annual compliance review, activated when the first production tenant is onboarded. The decision record links current follow-up `F-219`, which preserves the exact obligation, names the compliance owner and owning operations increment, records that activation trigger, requires an approved review report as acceptance evidence, gives an evidence-return route, and links back to the decision record. The follow-up remains open. The decision item is freshly observed in its accepted terminal state, and no authority conflict remains.

## Q-COMMENT

The authorized customer owner accepted a 30-day retention limit. The decision issue is closed, its final comment repeats the answer, and the Project item is terminal. No owning artifact or code change contains the obligation, and no linked follow-up exists.

## Q-UNCHANGED

The authorized customer owner accepted a seven-day export-link lifetime. The current canonical specification contains an identical seven-day sentence, but comparison with its prior authoritative revision shows that the sentence predates this decision and no owning artifact or code change is traced to the accepted obligation. The decision item is freshly observed in its accepted terminal state, and no linked follow-up exists.
