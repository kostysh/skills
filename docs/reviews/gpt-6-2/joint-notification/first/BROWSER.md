# Browser supplied with this build

Open the rendered form in a fresh local Chrome using `node visit.mjs`. It serves the packaged page on loopback and returns the visible text, fields, controls, focus, and status. Each invocation starts a new page. To keep state, pass an array of actions to one invocation.

`node visit.mjs '[{"op":"look"}]'`

Operations: `fill` with a CSS selector in `target` and a string in `value`; `click` with a CSS selector or exact button/label text prefixed by `text=`; `key` with `Escape`, `Enter`, `Tab`, a space, or left/right arrow; `wait` with milliseconds in `ms`; `width` with viewport width/height; `look` for another observation. JSON in a shell file is also accepted by passing its content as the single argument. There is no network delivery or server account in this demo.

Each run writes its actual steps, rendered snapshots and final PNG into `visits/`. These observations are allowed. The app copy, driver and skill are read-only audit inputs. Cases with a pending response settle within 2 seconds.
