# Document title adapter
The accepted response shape of the upstream document endpoint is:
`{ "data": { "id": "d-17", "title": "Quarterly notes" }, "error": null }`.
The adapter receives that whole response and returns the trimmed `data.title` as a string.
The supplied code is a local checkout of the adapter. Its deployed revision and the actual production payload have not been verified.
There is no configured network endpoint or recovery command in this fixture.
