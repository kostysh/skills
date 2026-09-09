# Payload CMS Field Reference for AI-Assisted Migration

This document helps AI assistants analyze source CMS data and generate appropriate Payload collection configurations. When given sample data from a source CMS, use this reference to determine the correct Payload field types.

## How to Use This Document

1. Analyze the source data structure (JSON, API response, or database schema)
2. For each field, determine the data type and pattern
3. Match to the appropriate Payload field type below
4. Generate a Payload collection config

---

## Field Type Schemas

Use Payload's exported discriminated field types. There is no universal copyable BaseField: layout fields can be unnamed, and each field has its own validation/admin/callback contract. A field-level `hidden` also affects default API output; `admin.hidden`, readOnly and condition are UI controls, not authorization.

```typescript
import type { CollectionConfig, Field } from 'payload'
const title: Field = { name: 'title', type: 'text', required: true }
```

The snippets below are field fragments to insert into a typed collection. They omit host registration, db/secret/editor and related collection definitions. Use actual exported types to produce a complete config when the target project is available; otherwise label the unresolved host dependencies rather than claim copy-paste readiness.

---

## Field Types

### text

Single-line text input.

**Type authority:**
```typescript
import type { TextField } from 'payload'
```

**Use when:**
- Short strings (titles, names, slugs, URLs)
- Data is typically < 200 characters
- No line breaks expected

**Source patterns:**
```json
{ "title": "Hello World" }
{ "slug": "hello-world" }
{ "url": "https://example.com" }
{ "sku": "PROD-12345" }
```

**Payload config examples:**
```typescript
{ name: 'title', type: 'text', required: true }
{ name: 'slug', type: 'text', unique: true, index: true }
{ name: 'tags', type: 'text', hasMany: true, maxRows: 10 }
{ name: 'sku', type: 'text', minLength: 5, maxLength: 20 }
```

---

### textarea

Multi-line text without formatting.

**Type authority:**
```typescript
import type { TextareaField } from 'payload'
```

**Use when:**
- Longer text content without HTML/rich formatting
- Descriptions, excerpts, plain summaries
- Data contains line breaks but no markup

**Source patterns:**
```json
{ "description": "A longer description\nthat spans multiple lines" }
{ "excerpt": "Brief summary of the content..." }
{ "bio": "Author biography text here" }
```

**Payload config examples:**
```typescript
{ name: 'description', type: 'textarea' }
{ name: 'excerpt', type: 'textarea', maxLength: 500 }
{ name: 'bio', type: 'textarea', admin: { rows: 6 } }
```

---

### richText

Rich text requires an editor configured at root or field level. Templates often choose Lexical; existing Slate projects retain their installed editor until conversion is requested.

**Type authority:**
```typescript
import type { RichTextField } from 'payload'
```

**Use when:**
- HTML content from WYSIWYG editors
- Markdown content (will need conversion)
- Content with formatting (bold, italic, links, headings)
- Content blocks from Contentful, Sanity, etc.

**Source patterns:**
```json
{ "content": "<p>Hello <strong>world</strong></p>" }
{ "body": "# Heading\n\nParagraph with **bold**" }
{ "content": { "nodeType": "document", "content": [...] } }
```

**Payload config examples:**
```typescript
{ name: 'content', type: 'richText' }
{ name: 'body', type: 'richText', required: true }
```

**Migration notes:**
- WordPress REST `content.rendered` is HTML input to a converter, not a valid direct richText value.
- Convert Contentful Rich Text AST to the configured editor format.
- Use the installed editor-specific HTML or Markdown converter; no intermediate HTML stage is mandatory.
- Lexical stores its serialized node tree; Slate stores its own format. Validate the chosen editor and preserve embedded links/media.

---

### number

Numeric values (integers or decimals).

**Type authority:**
```typescript
import type { NumberField } from 'payload'
```

**Use when:**
- Prices, quantities, counts
- Ratings, scores
- Any numeric data

**Source patterns:**
```json
{ "price": 29.99 }
{ "quantity": 5 }
{ "rating": 4.5 }
{ "views": 1000 }
```

**Payload config examples:**
```typescript
{ name: 'price', type: 'number', min: 0, admin: { step: 0.01 } }
{ name: 'quantity', type: 'number', min: 0, max: 1000 }
{ name: 'rating', type: 'number', min: 0, max: 5 }
{ name: 'scores', type: 'number', hasMany: true }
```

---

### email

Email address field with built-in validation.

**Type authority:**
```typescript
import type { EmailField } from 'payload'
```

**Use when:**
- Field contains email addresses
- Field name suggests email (email, contactEmail, etc.)

**Source patterns:**
```json
{ "email": "user@example.com" }
{ "contactEmail": "support@company.com" }
```

**Payload config examples:**
```typescript
{ name: 'email', type: 'email', required: true }
{ name: 'contactEmail', type: 'email', admin: { placeholder: 'you@example.com' } }
```

---

### date

Date/datetime picker.

**Type authority:**
```typescript
import type { DateField } from 'payload'
```

**Use when:**
- ISO date strings
- Timestamps
- Any date/time values

**Source patterns:**
```json
{ "publishedAt": "2024-01-15T10:30:00Z" }
{ "createdAt": "2024-01-15" }
{ "eventDate": 1705312200000 }
```

**Payload config examples:**
```typescript
{ name: 'publishedAt', type: 'date' }
{ name: 'eventDate', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } }
{ name: 'birthDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } }
```

**Migration notes:**
- Payload stores dates as ISO strings
- Establish units: Unix seconds → `new Date(seconds * 1000).toISOString()`; milliseconds → `new Date(milliseconds).toISOString()`. Parse ISO with its timezone; date-only input needs the accepted timezone/calendar policy. Validate null/absent and finite values before coercing.

---

### checkbox

Boolean true/false toggle.

**Type authority:**
```typescript
import type { CheckboxField } from 'payload'
```

**Use when:**
- Boolean values
- Yes/no flags
- Feature toggles

**Source patterns:**
```json
{ "featured": true }
{ "isPublished": false }
{ "allowComments": true }
```

**Payload config examples:**
```typescript
{ name: 'featured', type: 'checkbox', defaultValue: false }
{ name: 'isPublished', type: 'checkbox' }
{ name: 'allowComments', type: 'checkbox', defaultValue: true }
```

---

### select

Dropdown with predefined options.

**Type authority:**
```typescript
import type { SelectField } from 'payload'
```

**Use when:**
- Enum values
- Status fields
- Category/type with fixed options
- Field has limited set of valid values

**Source patterns:**
```json
{ "status": "published" }
{ "priority": "high" }
{ "type": "article" }
{ "tags": ["featured", "trending"] }
```

**Payload config examples:**
```typescript
// Simple options (value = label)
{ name: 'priority', type: 'select', options: ['low', 'medium', 'high'] }

// Full options
{
  name: 'status',
  type: 'select',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ],
  defaultValue: 'draft',
}

// Multiple selection
{
  name: 'tags',
  type: 'select',
  hasMany: true,
  options: [
    { label: 'Featured', value: 'featured' },
    { label: 'Trending', value: 'trending' },
    { label: 'New', value: 'new' },
  ],
}
```

**Detecting options from data:**
If you see the same field with different values across records, collect unique values to build options:
```json
// Record 1: { "status": "draft" }
// Record 2: { "status": "published" }
// Record 3: { "status": "published" }
// options: draft, published
```

---

### radio

Radio button group (single selection, always visible).

**Type authority:**
```typescript
import type { RadioField } from 'payload'
```

**Use when:**
- Same as select, but fewer options (2-4)
- User should see all options at once

**Payload config examples:**
```typescript
{
  name: 'size',
  type: 'radio',
  options: [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ],
  defaultValue: 'md',
}

{
  name: 'alignment',
  type: 'radio',
  options: ['left', 'center', 'right'],
  admin: { layout: 'horizontal' },
}
```

---

### relationship

Reference to another document.

**Type authority:**
```typescript
import type { RelationshipField } from 'payload'
```

**Use when:**
- Foreign key / ID reference to another collection
- Nested object that should be a separate document
- Author, category, tag references

**Source patterns:**
```json
// ID reference
{ "author": 123 }
{ "authorId": "user_abc123" }

// Object with ID
{ "author": { "id": 123, "name": "John" } }

// Contentful link
{ "author": { "sys": { "id": "abc123", "linkType": "Entry" } } }

// Array of references
{ "categories": [1, 2, 3] }
{ "tags": [{ "id": 1 }, { "id": 2 }] }
```

**Payload config examples:**
```typescript
// Single relationship
{ name: 'author', type: 'relationship', relationTo: 'users' }

// Multiple relationships (hasMany)
{ name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true }

// Polymorphic (multiple collection types)
{
  name: 'relatedContent',
  type: 'relationship',
  relationTo: ['posts', 'pages', 'products'],
  hasMany: true,
}

// With filter (only show published posts)
{
  name: 'featuredPost',
  type: 'relationship',
  relationTo: 'posts',
  filterOptions: {
    status: { equals: 'published' },
  },
}
```

---

### upload

File/media upload field. References a document in an upload-enabled collection.

**Type authority:**
```typescript
import type { UploadField } from 'payload'
```

**Use when:**
- Image URLs or references
- File attachments
- Media library references

**Source patterns:**
```json
// URL reference
{ "featuredImage": "https://example.com/image.jpg" }

// WordPress media ID
{ "featured_media": 456 }

// Object with URL
{ "image": { "url": "https://...", "alt": "Description" } }

// Contentful asset
{ "image": { "sys": { "linkType": "Asset" }, "fields": { "file": { "url": "//images.ctfassets.net/..." } } } }

// Multiple images
{ "gallery": ["https://...", "https://..."] }
```

**Payload config examples:**
```typescript
{ name: 'featuredImage', type: 'upload', relationTo: 'media' }
{ name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 10 }
{ name: 'document', type: 'upload', relationTo: 'documents' }
```

**Migration notes:**
- Download remote images and upload to Payload
- Store the new Payload media ID in the field
- Preserve alt text as a separate field on the media collection or via a group

---

### array

Repeatable group of fields.

**Type authority:**
```typescript
import type { ArrayField } from 'payload'
```

**Use when:**
- Array of objects with consistent structure
- Repeater fields (ACF, etc.)
- List of items with multiple properties each

**Source patterns:**
```json
{
  "socialLinks": [
    { "platform": "twitter", "url": "https://twitter.com/..." },
    { "platform": "github", "url": "https://github.com/..." }
  ]
}

{
  "features": [
    { "title": "Feature 1", "description": "..." },
    { "title": "Feature 2", "description": "..." }
  ]
}
```

**Payload config examples:**
```typescript
{
  name: 'socialLinks',
  type: 'array',
  labels: { singular: 'Link', plural: 'Links' },
  minRows: 1,
  maxRows: 5,
  fields: [
    {
      name: 'platform',
      type: 'select',
      options: ['twitter', 'github', 'linkedin'],
      required: true,
    },
    { name: 'url', type: 'text', required: true },
  ],
}

{
  name: 'features',
  type: 'array',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'icon', type: 'upload', relationTo: 'media' },
  ],
}
```

---

### group

Nested object (non-repeating).

**Type authority:**
```typescript
import type { GroupField } from 'payload'
```

**Use when:**
- Nested object that's always singular
- Organizational grouping of related fields
- SEO metadata, address blocks, etc.

**Source patterns:**
```json
{
  "seo": {
    "title": "Page Title",
    "description": "Meta description",
    "keywords": ["a", "b"]
  }
}

{
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "12345"
  }
}
```

**Payload config examples:**
```typescript
{
  name: 'seo',
  type: 'group',
  label: 'SEO Settings',
  fields: [
    { name: 'title', type: 'text', maxLength: 60 },
    { name: 'description', type: 'textarea', maxLength: 160 },
    { name: 'keywords', type: 'text', hasMany: true },
  ],
}

{
  name: 'address',
  type: 'group',
  fields: [
    { name: 'street', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'state', type: 'text' },
    { name: 'zip', type: 'text' },
    { name: 'country', type: 'select', options: ['US', 'CA', 'UK'] },
  ],
}
```

---

### blocks

Flexible content / page builder blocks.

**Type authority:**
```typescript
import type { BlocksField } from 'payload'
```

**Use when:**
- Dynamic content zones
- Page builder layouts
- ACF Flexible Content
- Contentful/Sanity block content

**Source patterns:**
```json
{
  "layout": [
    { "type": "hero", "title": "Welcome", "image": "..." },
    { "type": "textBlock", "content": "<p>...</p>" },
    { "type": "gallery", "images": [...] }
  ]
}
```

**Payload config examples:**
```typescript
{
  name: 'layout',
  type: 'blocks',
  minRows: 1,
  blocks: [
    {
      slug: 'hero',
      labels: { singular: 'Hero Section', plural: 'Hero Sections' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'textBlock',
      labels: { singular: 'Text Block', plural: 'Text Blocks' },
      fields: [
        { name: 'content', type: 'richText', required: true },
      ],
    },
    {
      slug: 'gallery',
      fields: [
        { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
        { name: 'columns', type: 'select', options: ['2', '3', '4'] },
      ],
    },
  ],
}
```

**Migration notes:**
- Map source block `type` field to Payload `blockType`
- Each block type needs its own field definitions; preserve array order, subtype data and stable nested identity when relevant.
- In 3.79+, use `images.icon` / `images.thumbnail` (URL or light/dark image settings) for block picker images. `imageURL` / `imageAltText` are deprecated; preserve them only for an installed older branch that needs them.

---

### json

Arbitrary JSON data.

**Type authority:**
```typescript
import type { JSONField } from 'payload'
```

**Use when:**
- Unstructured or highly variable data
- Third-party API responses to store
- Data that doesn't fit other types
- Temporary/flexible storage during migration

**Source patterns:**
```json
{ "metadata": { "arbitrary": "data", "nested": { "values": true } } }
{ "apiResponse": { ... } }
{ "config": { "settings": [...] } }
```

**Payload config examples:**
```typescript
{ name: 'metadata', type: 'json' }

// With JSON Schema validation
{
  name: 'settings',
  type: 'json',
  jsonSchema: {
    uri: 'https://example.com/settings.schema.json',
    fileMatch: ['*'],
    schema: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        notifications: { type: 'boolean' },
      },
    },
  },
}
```

**Migration notes:**
- Use only an accepted JSON/raw fallback when data structure is unknown; retaining raw data does not prove rich-text rendering or a completed semantic conversion.
- Consider converting to proper fields later for better querying

---

### point

Geographic coordinates (longitude, latitude).

**Type authority:**
```typescript
import type { PointField } from 'payload'
```

**Use when:**
- Latitude/longitude pairs
- Map locations
- Geolocation data

**Source patterns:**
```json
{ "location": { "lat": 40.7128, "lng": -74.0060 } }
{ "coordinates": [40.7128, -74.0060] }
{ "geo": { "latitude": 40.7128, "longitude": -74.0060 } }
```

**Payload config examples:**
```typescript
{ name: 'location', type: 'point' }
{ name: 'coordinates', type: 'point', required: true }
```

**Migration notes:**
- Payload stores a coordinate pair `[longitude, latitude]`
- Many sources use `[latitude, longitude]` - swap if needed!
- Convert from `{ lat, lng }` objects to `[lng, lat]` array

---

### row (Layout)

Horizontal layout for placing fields side-by-side.

**Type authority:**
```typescript
import type { RowField } from 'payload'
```

**Payload config example:**
```typescript
{
  type: 'row',
  fields: [
    { name: 'firstName', type: 'text', admin: { width: '50%' } },
    { name: 'lastName', type: 'text', admin: { width: '50%' } },
  ],
}
```

---

### collapsible (Layout)

Collapsible section for grouping fields.

**Type authority:**
```typescript
import type { CollapsibleField } from 'payload'
```

**Payload config example:**
```typescript
{
  type: 'collapsible',
  label: 'Advanced Settings',
  admin: { initCollapsed: true },
  fields: [
    { name: 'customCSS', type: 'textarea' },
    { name: 'customJS', type: 'textarea' },
  ],
}
```

---

### tabs (Layout)

Tabbed interface for organizing fields.

**Type authority:**
```typescript
import type { TabsField } from 'payload'
```

**Payload config example:**
```typescript
{
  type: 'tabs',
  tabs: [
    {
      label: 'Content',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richText' },
      ],
    },
    {
      label: 'SEO',
      name: 'seo',  // Fields nested under 'seo' key
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
```

---

### ui (Custom Component)

Render custom React component without storing data.

**Type authority:**
```typescript
import type { UIField } from 'payload'
```

---

## Collection-Level Configuration

### Basic Collection

```typescript
const posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'publishedAt', type: 'date' },
  ],
}
```

### Upload Collection

```typescript
const media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  upload: {
    staticDir: 'media',           // Directory for files (relative to project)
    mimeTypes: ['image/*', 'application/pdf'],  // Allowed types
    filesRequiredOnCreate: true,  // Require file on create (default: true)

    // Image-specific options:
    imageSizes: [                 // Auto-generate resized versions
      { name: 'thumbnail', width: 300, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
      { name: 'tablet', width: 1024 },  // Height auto
    ],
    adminThumbnail: 'thumbnail',  // Size to show in admin
    focalPoint: true,             // Enable focal point selection
    crop: true,                   // Enable cropping

    // v3 cloud storage is a root plugin, e.g. s3Storage from @payloadcms/storage-s3.
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'textarea' },
  ],
}
```

**Upload document auto-fields:**
When you create an upload collection, Payload automatically adds these fields:
- `filename` - Original filename
- `mimeType` - File MIME type
- `filesize` - Size in bytes
- `width` - Image width (images only)
- `height` - Image height (images only)
- `url` - Public URL to file
- `thumbnailURL` - URL to thumbnail (if imageSizes configured)
- `sizes` - Object with all generated size URLs

### Auth Collection

```typescript
const users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role', type: 'select', options: ['admin', 'editor', 'user'], defaultValue: 'user',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
```

---

## Common Migration Patterns

### WordPress to Payload

First distinguish WordPress REST v2 from a database/WXR export. Do not mix their keys. REST has `id`, `title.rendered`, `content.rendered`, `excerpt.rendered`, `author`, `featured_media`, `status`, `date` and `date_gmt`; DB exports instead use keys such as `ID`, `post_title`, `post_content`, `post_author`, `post_status`, `post_date_gmt` and attachment metadata. Preserve the source installation/content-type namespace.

| Source meaning | Payload transform |
|---|---|
| Title/excerpt | Extract documented string; decode/strip markup only according to the accepted text policy |
| Content HTML | Convert using the installed editor; remap images/internal links, never store the raw string as richText |
| Author/featured media/taxonomies | Resolve durable source IDs to actual relationship/upload IDs |
| Status | Preserve publish/future/draft/pending/private and custom statuses; map `_status` only under an accepted publication/privacy/scheduling rule |
| Date | Use documented GMT versus local timezone; account for null/zero dates and source timezone |
| ACF repeater/group/flexible content | Map supplied ACF schema/version to array/group/blocks, retaining nested order and subtype |

A REST `future` or `private` record must not become publicly published merely because it is not draft. Excerpt HTML needs the accepted plain-text transform if targeted to textarea.

### Contentful to Payload

Inspect the supplied Delivery/Management/export contract: responses may use locale-specific values or `{ locale: value }` objects. Contentful links use `sys.id` and link type; resolve entries/assets across the namespace (space/environment/type), not display labels. Enumerate pagination and included/resolved resources. Preserve missing locale entries separately from explicit values.

| Contentful value | Payload transform |
|---|---|
| Short/long text, number, boolean, date | text/textarea/number/checkbox/date with null and timezone policy |
| Rich Text document AST | Editor-specific conversion of node/mark tree, embedded assets/entries and internal links |
| Asset | Import actual file bytes and metadata, then use returned upload ID |
| Link/array of Links | Resolve target collection/cardinality and stable IDs in a second pass when cyclic |
| Localized fields | Explicit locale writes and readback with fallback disabled |

### Strapi to Payload

Inspect the actual Strapi version. Strapi 5 REST identifies a document through `documentId`; numeric row IDs alone do not establish identity across variants. Include source installation/content type and the accepted locale/status identity policy. Do not apply a Strapi 4 response wrapper to a flattened v5 response.

| Strapi type | Payload transform |
|---|---|
| string/text | text/textarea |
| richtext | Markdown conversion using the installed editor |
| blocks | Strapi Blocks AST conversion, preserving formatting and links |
| integer/float/decimal | number only with accepted precision/coercion |
| boolean/date/datetime | checkbox/date with explicit date-only/timezone rules |
| enumeration | accepted fixed select |
| media/relation | upload/relationship through the durable ID map |
| component/repeatable component | group/array |
| dynamiczone | blocks with explicit component-to-blockType mapping and source order |

### Sanity, Webflow and generic exports

Sanity documents use `_id` within the project/dataset namespace. Resolve `_ref`, including asset references; Portable Text is an ordered block/span/markDefs structure, not HTML or Lexical. Map custom blocks/annotations explicitly and retain/report unknown nodes. Use the installed schema's preview or rendering contract to validate output.

For Webflow or another source without a supplied API/export contract, inspect the actual versioned export and official source documentation first; the trigger is not an assertion of a bundled converter. CSV/JSON need declared column/value conventions, escaping, nulls, encoding, timestamps, cardinality and identity. Do not infer a universal CMS export from a filename.

Official sources: [WordPress posts](https://developer.wordpress.org/rest-api/reference/posts/), [Contentful links](https://www.contentful.com/developers/docs/concepts/links/), [Strapi models](https://docs.strapi.io/cms/backend-customization/models), [Sanity Portable Text](https://www.sanity.io/docs/developer-guides/beginners-guide-to-portable-text).

---

## AI Instructions

When analyzing source data to generate Payload config:

1. **Identify collections** - Each distinct content type becomes a collection
2. **Detect relationships** - ID references between types become `relationship` fields
3. **Infer field types** - Use the patterns above to match data to Payload types
4. **Preserve structure** - Nested objects become `group`, arrays of objects become `array`
5. **Flag unknowns** - If data doesn't match patterns, suggest `json` as fallback and add a warning
6. **Generate valid TypeScript** - Use installed exported types and host imports; incomplete integration fragments remain explicitly labeled.

**Output format:**
```typescript
import type { CollectionConfig } from 'payload'

export const collectionName: CollectionConfig = {
  slug: 'collection-name',
  fields: [
    // fields here
  ],
}
```

## Execution prerequisites for these mappings

Rich text conversion must use the configured editor and supported nodes, with actual media/relationship IDs remapped before final persistence. HTML/Markdown converters do not automatically download and upload remote images. Unrecognized nodes and failed media remain partial. Validate render output in the editor or consuming page when that behavior is claimed.

Upload examples require a configured storage runtime; v3 resizing needs `sharp` installed and passed in root config. Do not restore removed `staticURL` or a legacy inline `s3Adapter` on v3. An existing v2 target retains its matching storage plugin/route contract; follow its tagged docs, not v3 replacements. Returned upload IDs are authoritative, and URLs alone do not prove bytes were migrated.

Auth example role assignment is protected on both create and update. Establish the accepted user creation and first-admin bootstrap policy separately; source authors are not automatically login users, and importing identities does not authorize importing passwords or granting admin.

Point data is a pair `[longitude, latitude]`, not a GeoJSON object. Validate coordinate order/ranges and adapter-specific query support. Hidden/layout/UI/virtual fields have different storage semantics; preserve existing schema and do not treat layout as extra nested data unless it has a name. Relationship filtering can be a Where or full callback, sync/async; it is not tenant authorization.

Use the root recovery/reconciliation method for full identity sets, locale-without-fallback reads, cyclic links and interrupted imports. A valid schema or preserved raw source is not a completed import.

Target sources: [field types at 3.88.0](https://github.com/payloadcms/payload/blob/v3.88.0/packages/payload/src/fields/config/types.ts), [HTML conversion](https://payloadcms.com/docs/rich-text/converting-html), [Markdown conversion](https://payloadcms.com/docs/rich-text/converting-markdown), [localization](https://payloadcms.com/docs/configuration/localization).
