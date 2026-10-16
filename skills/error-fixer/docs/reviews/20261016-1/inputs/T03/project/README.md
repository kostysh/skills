# Card catalog
A catalog is a JSON array of records `{ id, title, pinned }`.
The local consumer loads it with `loadCatalog`, changes one card with `setPinned`, saves it with `saveCatalog`, closes the session, then later calls `loadCatalog` again.
Pinning and unpinning must both survive that save/reload path. Titles, order, and other cards must remain unchanged. A missing card id is an error; it must not silently succeed.
Existing records that have no `pinned` field are read as `false` for backward compatibility.
The application is local only. `npm test` is the required local acceptance command.
