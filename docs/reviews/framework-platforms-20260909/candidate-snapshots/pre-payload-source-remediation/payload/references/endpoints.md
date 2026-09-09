# Payload custom endpoints

Payload v3 endpoints use Web Request/Response, not Express `res`/`next`. Keep an existing v2 application's installed handler contract. These v3 integration fragments require the host's collections, generated types and request validation.

## Placement and request contract

A config endpoint is mounted under the configured API route (default `/api`); collection endpoints add the collection slug, and globals add `/globals/<slug>`. `path` can include `:id`, available through `req.routeParams`. Verify actual route registration; defining a function is not HTTP evidence.

Use the installed `Endpoint` type for `path`, lowercase `method`, `handler` and optional `custom` metadata. A handler must return a `Response` or throw a handled `APIError`. `req.user`, `req.payload`, `req.headers`, `req.locale`, `req.fallbackLocale`, `req.routeParams` and body helpers provide context, not automatic authorization.

## Caller authorization

For every caller-scoped Local API CRUD, count, search, preview or upload operation, pass **`req` and `overrideAccess: false`**. Authentication alone does not grant the requested collection operation. Public endpoints may intentionally accept anonymous users and still enforce public access. `req.payload` alone defaults to bypass.

```ts
import type { Endpoint } from 'payload'
import { APIError } from 'payload'

export const searchPosts: Endpoint = {
  path: '/search',
  method: 'get',
  handler: async (req) => {
    const q = new URL(req.url!).searchParams.get('q')
    if (!q || q.length > 200) throw new APIError('Invalid query', 400)
    const posts = await req.payload.find({
      collection: 'posts',
      req,
      overrideAccess: false,
      where: { title: { contains: q } },
      limit: 20,
      depth: 0,
    })
    return Response.json(posts)
  },
}
```

```ts
import type { Endpoint } from 'payload'
import { APIError } from 'payload'

export const updatePost: Endpoint = {
  path: '/:id/title', method: 'patch',
  handler: async (req) => {
    const id = req.routeParams?.id
    const data: unknown = await req.json!()
    if ((typeof id !== 'string' && typeof id !== 'number') ||
        !data || typeof data !== 'object' || !('title' in data) ||
        typeof data.title !== 'string') throw new APIError('Invalid input', 400)
    const doc = await req.payload.update({
      collection: 'posts', id, data: { title: data.title }, req, overrideAccess: false,
    })
    return Response.json(doc)
  },
}
```

Apply the same request options to findByID/create/delete/count and global operations. Do not accept arbitrary caller-supplied `overrideAccess`, user, tenant or config metadata. Use the project's validated slug allowlist for a generic collection endpoint and cap supplied limits. A preview response returns permitted data, not raw internal collection config/functions.

## Body, files, locale and CORS

Read the body once. `await req.json()` parses JSON; `await req.text()` preserves raw text for signature verification. `await addDataAndFileToRequest(req)` handles Payload JSON/multipart input and populates `req.data`/`req.file`; the file is Payload's upload data object, not necessarily a browser File. If locale is supplied in parsed data, call the installed `addLocalesToRequestFromData(req)` after parsing. Do not mix these paths on a consumed body.

```ts
import type { Endpoint } from 'payload'
import { APIError, addDataAndFileToRequest, headersWithCors } from 'payload'

export const uploadMedia: Endpoint = {
  path: '/upload', method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req)
    if (!req.file || typeof req.data?.alt !== 'string') {
      throw new APIError('File and alt required', 400)
    }
    const media = await req.payload.create({
      collection: 'media', data: { alt: req.data.alt }, file: req.file,
      req, overrideAccess: false,
    })
    return Response.json(media, {
      headers: headersWithCors({ headers: new Headers(), req }),
    })
  },
}
```

CORS is browser cross-origin policy, not authorization. Do not cache caller-specific responses as public. Validate upload type/size using the accepted collection and deployment policy; preserve request transaction context for related database writes.

## Authentication and system actions

For custom multi-tenant login, verify credentials using Payload's installed login API and establish that the authenticated user belongs to the requested tenant before returning a token or setting a cookie. Tenant claims must come from server-owned membership, not submitted data. Prefer the built-in login route when it satisfies the task. If a pre-login system lookup is necessary, scope it to the exact tenant/credential identity, explicitly document bypass authority, return generic failures and never expose the lookup result. Use the installed `generatePayloadCookie` with the actual sanitized auth config and `headersWithCors` when custom cookie handling is required. Local login does not by itself establish a browser session.

For Stripe or other webhooks, verify the signature over the raw body using the provider's installed SDK and trusted secret, with the applicable timestamp/replay policy, before processing. App `processWebhook`/payment helpers are not Payload APIs. A verified webhook can authorize a narrowly scoped system write; still pass req for database context, implement event idempotency, and separate provider effects from DB rollback. Do not log secrets or return internal error details.

Reindex, import/export and cache-clear endpoints need the agreed operation-specific policy, not merely `if (req.user)`. If an internal helper uses Local API, preserve caller policy or explicitly establish system authority before bypassing it. Return completion only after required work completes; if queued, return queued state and inspect the eventual result separately. Route cache semantics to nextjs and provider verification to its owner while retaining endpoint validation and authorization here.

## Factories, conditional routes and metadata

An endpoint factory can accept typed configuration and return an `Endpoint`; capture only needed inputs and apply the same body/auth/error rules inside the returned handler. Conditional registration uses a typed `Endpoint[]` assembled from enabled options. Preserve existing endpoint arrays when composing plugins. Custom root means config-level placement; do not add obsolete `root: true`.

`custom.openapi` can hold application metadata. It does not generate an OpenAPI document without an actual consuming integration. Verify the installed generator before claiming documentation output.

## Verification

Exercise the real registered HTTP route with success, malformed input, anonymous and forbidden actors; compare permitted record IDs with standard REST access. Read persistence after writes and denial attempts. For uploads verify bytes/metadata and returned ID; for session changes verify browser cookies and a subsequent authenticated request. A direct function call or build proves only that narrower boundary.

Sources: [REST endpoints](https://payloadcms.com/docs/rest-api/overview#custom-endpoints), [Local API access](https://payloadcms.com/docs/local-api/access-control), [3.88.0 request helper](https://github.com/payloadcms/payload/blob/v3.88.0/packages/payload/src/utilities/addDataAndFileToRequest.ts).
