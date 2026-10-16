# Supplied history
1. First repair added `Boolean(pinned)` to the setter. Immediate in-memory smoke passed. Operator then closed and reopened the catalog; the card was no longer pinned.
2. Second repair normalized missing `pinned` values in the loader with `Boolean(card.pinned)`. The same smoke passed. Operator again reported that a newly pinned card was not pinned after reopen.
The history is supplied task evidence. It is not a transcript of this trial and does not authorize unrelated repairs.
