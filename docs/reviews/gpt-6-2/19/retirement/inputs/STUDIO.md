# Press Studio

This project uses its own local adapter for the team's native editable document. Its tables and internal handles belong to the editor. Use the adapter for native reads and writes. A different desktop or remote service cannot open this team's project. The brief and Markdown handoffs can be edited with the normal text tools.

From this directory run `python3 studio.py FILE.pen COMMAND`. The commands are

- `frames` lists frames and the current revision.
- `inspect FRAME` shows the saved layer IDs, positions, text and style tokens in a frame.
- `style FRAME LAYER_ID TOKEN` assigns an existing text token in the native document.
- `export FRAME PATH.svg` writes a vector proof. The local compositor ordinarily uses its installed preview cache. Add `--current` after the output path to bypass the cache.

The adapter's receipts go into `.studio/operations.jsonl`.
