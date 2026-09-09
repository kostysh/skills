# Payload Field Types Reference

Version-scoped field integration fragments. Import `buildConfig` and preserve host db/secret/editor when extending global config. Generate project types and validate examples against the installed exports.

## Text Field

```ts
import type { TextField } from 'payload'

const textField: TextField = {
  name: 'title',
  type: 'text',
  required: true,
  unique: true,
  minLength: 5,
  maxLength: 100,
  index: true,
  localized: true,
  defaultValue: 'Default Title',
  admin: {
    placeholder: 'Enter title...',
    position: 'sidebar',
    condition: (data) => data.showTitle === true,
  },
}
```

Custom `validate` replaces the built-in validator. Keep the built-in required/min/max behavior when adding a business rule:

```ts
import { validations } from 'payload'
import type { TextField } from 'payload'
const customTitle: TextField = {
  name: 'title', type: 'text', required: true, minLength: 5, maxLength: 100,
  validate: async (value, options) => {
    const base = await validations.text(value, options)
    if (base !== true) return base
    return value === 'reserved' ? 'Choose another title' : true
  },
}
```

### Slug Field Helper

`slugField` is experimental in 3.88.0. Use it only when the installed export and the project permit experimental helpers; preserve an existing text+hook slug implementation on older versions.

```ts
import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({
      name: 'slug', // defaults to 'slug'
      useAsSlug: 'title', // defaults to 'title'
      checkboxName: 'generateSlug', // defaults to 'generateSlug'
      localized: true,
      required: true,
      overrides: (defaultField) => {
        // Customize the generated fields if needed
        return defaultField
      },
    }),
  ],
}
```

## Rich Text (Lexical)

```ts
import type { RichTextField } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { HeadingFeature, LinkFeature } from '@payloadcms/richtext-lexical'

const richTextField: RichTextField = {
  name: 'content',
  type: 'richText',
  required: true,
  localized: true,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      HeadingFeature({
        enabledHeadingSizes: ['h1', 'h2', 'h3'],
      }),
      LinkFeature({
        enabledCollections: ['posts', 'pages'],
      }),
    ],
  }),
}
```

### Advanced Lexical Configuration

`EXPERIMENTAL_TableFeature` is experimental, not stable-contract table support. Verify its installed export and chosen editor nodes; do not add it to an existing editor unless requested. Replacing `features` replaces defaults; adding customized default features should replace the matching default entry rather than duplicate its key.

```ts
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  IndentFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

// Global editor config with full features
export default buildConfig({
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
})

// Field-specific editor with custom toolbar
const richTextWithToolbars: RichTextField = {
  name: 'richText',
  type: 'richText',
  editor: lexicalEditor({
    features: ({ rootFeatures }) => {
      return [
        ...rootFeatures,
        HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
        FixedToolbarFeature(),
        InlineToolbarFeature(),
      ]
    },
  }),
  label: false,
}
```

## Relationship

```ts
import type { RelationshipField, PolymorphicRelationshipField } from 'payload'

// Single relationship
const singleRelationship: RelationshipField = {
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  required: true,
  maxDepth: 2,
}

// Multiple relationships (hasMany)
const multipleRelationship: RelationshipField = {
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
  filterOptions: {
    active: { equals: true },
  },
}

// Polymorphic relationship
const polymorphicRelationship: PolymorphicRelationshipField = {
  name: 'relatedContent',
  type: 'relationship',
  relationTo: ['posts', 'pages'],
  hasMany: true,
}
```

## Array

```ts
import type { ArrayField } from 'payload'

const arrayField: ArrayField = {
  name: 'slides',
  type: 'array',
  minRows: 2,
  maxRows: 10,
  labels: {
    singular: 'Slide',
    plural: 'Slides',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  admin: {
    initCollapsed: true,
  },
}
```

## Blocks

```ts
import type { BlocksField, Block } from 'payload'

const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'background',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}

const ContentBlock: Block = {
  slug: 'content',
  fields: [
    {
      name: 'text',
      type: 'richText',
    },
  ],
}

const blocksField: BlocksField = {
  name: 'layout',
  type: 'blocks',
  blocks: [HeroBlock, ContentBlock],
}
```

## Select

```ts
import type { SelectField } from 'payload'

const selectField: SelectField = {
  name: 'status',
  type: 'select',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  defaultValue: 'draft',
  required: true,
}

// Multiple select
const multiSelectField: SelectField = {
  name: 'tags',
  type: 'select',
  hasMany: true,
  options: ['tech', 'news', 'sports'],
}
```

## Upload

```ts
import type { UploadField } from 'payload'

const uploadField: UploadField = {
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  required: true,
  filterOptions: {
    mimeType: { contains: 'image' },
  },
}
```

## Point (Geolocation)

Point fields store geographic coordinates with automatic 2dsphere indexing for geospatial queries.

```ts
import type { PointField } from 'payload'

const locationField: PointField = {
  name: 'location',
  type: 'point',
  label: 'Location',
  required: true,
}

// Returns [longitude, latitude]
// Example: [-122.4194, 37.7749] for San Francisco
```

### Geospatial Queries

```ts
// Query by distance (sorted by nearest first)
const nearbyLocations = await payload.find({
  collection: 'stores',
  where: {
    location: {
      near: '10,20,5000,1000', // longitude,latitude,maxDistance,minDistance (meters)
    },
  },
})

// Query within polygon area
const polygon: [number, number][] = [
  [9.0, 19.0], // bottom-left
  [9.0, 21.0], // top-left
  [11.0, 21.0], // top-right
  [11.0, 19.0], // bottom-right
  [9.0, 19.0], // closing point
]

const withinArea = await payload.find({
  collection: 'stores',
  where: {
    location: {
      within: {
        type: 'Polygon',
        coordinates: [polygon],
      },
    },
  },
})

// Query intersecting area
const intersecting = await payload.find({
  collection: 'stores',
  where: {
    location: {
      intersects: {
        type: 'Polygon',
        coordinates: [polygon],
      },
    },
  },
})
```

**Note**: Point fields are not supported in SQLite.

## Join Fields

Join fields create reverse relationships, allowing you to access related documents from the "other side" of a relationship.

```ts
import type { JoinField } from 'payload'

// From Users collection - show user's orders
const ordersJoinField: JoinField = {
  name: 'orders',
  type: 'join',
  collection: 'orders',
  on: 'customer', // The field in 'orders' that references this user
  admin: {
    allowCreate: false,
    defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
  },
}

// From Users collection - show user's cart
const cartJoinField: JoinField = {
  name: 'cart',
  type: 'join',
  collection: 'carts',
  on: 'customer',
  admin: {
    allowCreate: false,
    defaultColumns: ['id', 'createdAt', 'total', 'currency'],
  },
}
```

## Virtual Fields

```ts
import type { TextField } from 'payload'

// Computed from siblings
const computedVirtualField: TextField = {
  name: 'fullName',
  type: 'text',
  virtual: true,
  hooks: {
    afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
  },
}

// From relationship path
const pathVirtualField: TextField = {
  name: 'authorName',
  type: 'text',
  virtual: 'author.name',
}
```

## Conditional Fields

```ts
import type { UploadField, CheckboxField } from 'payload'

// Simple boolean condition
const enableFeatureField: CheckboxField = {
  name: 'enableFeature',
  type: 'checkbox',
}

const conditionalField: TextField = {
  name: 'featureText',
  type: 'text',
  admin: {
    condition: (data) => data.enableFeature === true,
  },
}

// Sibling data condition (from hero field pattern)
const typeField: SelectField = {
  name: 'type',
  type: 'select',
  options: ['none', 'highImpact', 'mediumImpact', 'lowImpact'],
  defaultValue: 'lowImpact',
}

const mediaField: UploadField = {
  name: 'media',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
  },
  required: true,
}
```

## Radio

Radio fields present options as radio buttons for single selection.

```ts
import type { RadioField } from 'payload'

const radioField: RadioField = {
  name: 'priority',
  type: 'radio',
  options: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ],
  defaultValue: 'medium',
  admin: {
    layout: 'horizontal', // or 'vertical'
  },
}
```

## Row (Layout)

Row fields arrange fields horizontally in the admin panel (presentational only).

```ts
import type { RowField } from 'payload'

const rowField: RowField = {
  type: 'row',
  fields: [
    {
      name: 'firstName',
      type: 'text',
      admin: { width: '50%' },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: { width: '50%' },
    },
  ],
}
```

## Collapsible (Layout)

Collapsible fields group fields in an expandable/collapsible section.

```ts
import type { CollapsibleField } from 'payload'

const collapsibleField: CollapsibleField = {
  label: 'Advanced Options',
  type: 'collapsible',
  admin: {
    initCollapsed: true,
  },
  fields: [
    { name: 'customCSS', type: 'textarea' },
    { name: 'customJS', type: 'code' },
  ],
}
```

## UI (Custom Components)

UI fields allow fully custom React components in the admin (no data stored).

```ts
import type { UIField } from 'payload'

const uiField: UIField = {
  name: 'customMessage',
  type: 'ui',
  admin: {
    components: {
      Field: '/path/to/CustomFieldComponent',
      Cell: '/path/to/CustomCellComponent', // For list view
    },
  },
}
```

## Tabs & Groups

```ts
import type { TabsField, GroupField } from 'payload'

// Tabs
const tabsField: TabsField = {
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
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
      ],
    },
  ],
}

// Group (named)
const groupField: GroupField = {
  name: 'meta',
  type: 'group',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
```

## Reusable Field Factories

Create composable field patterns that can be customized with overrides.

```ts
import type { Field, GroupField } from 'payload'

// Merge only the levels this factory owns; fields overrides intentionally replace fields.
const mergeGroup = (target: GroupField, source: Partial<GroupField>): GroupField => ({
  ...target, ...source, admin: { ...target.admin, ...source.admin },
})

// Reusable link field factory
type LinkType = (options?: {
  appearances?: ('default' | 'outline')[] | false
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}) => GroupField

export const link: LinkType = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
  const linkField: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            options: [
              { label: 'Internal link', value: 'reference' },
              { label: 'Custom URL', value: 'custom' },
            ],
            defaultValue: 'reference',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
          },
          {
            name: 'newTab',
            type: 'checkbox',
            label: 'Open in new tab',
            admin: {
              width: '50%',
              style: {
                alignSelf: 'flex-end',
              },
            },
          },
        ],
      },
      {
        name: 'reference',
        type: 'relationship',
        relationTo: ['pages'],
        required: true,
        maxDepth: 1,
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'reference',
        },
      },
      {
        name: 'url',
        type: 'text',
        label: 'Custom URL',
        required: true,
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'custom',
        },
      },
    ],
  }

  if (!disableLabel) {
    linkField.fields.push({
      name: 'label',
      type: 'text',
      required: true,
    })
  }

  if (appearances !== false) {
    if (appearances?.length === 0) throw new Error('At least one appearance is required')
    linkField.fields.push({
      name: 'appearance',
      type: 'select',
      defaultValue: (appearances ?? ['default', 'outline'])[0],
      options: (appearances ?? ['default', 'outline']).map((value) => ({ label: value, value })),
    })
  }

  return mergeGroup(linkField, overrides)
}

// Usage
const navItem = link({ appearances: false })
const ctaButton = link({
  overrides: {
    name: 'cta',
    admin: {
      description: 'Call to action button',
    },
  },
})
```

## Field Type Guards

Type guards for runtime field type checking and safe type narrowing.

| Type Guard                  | Checks For                                                  | Use When                                 |
| --------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `fieldAffectsData`          | Has name and is not UI-only; includes virtual fields                   | Need to access field data or name        |
| `fieldHasSubFields`         | Field contains nested fields (group/array/row/collapsible)  | Need to recursively traverse fields      |
| `fieldIsArrayType`          | Field is array type                                         | Distinguish arrays from other containers |
| `fieldIsBlockType`          | Field is blocks type                                        | Handle blocks-specific logic             |
| `fieldIsGroupType`          | Field is group type                                         | Handle group-specific logic              |
| `fieldSupportsMany`         | Field can have multiple values (select/relationship/upload) | Check for `hasMany` support              |
| `fieldHasMaxDepth`          | Field supports population depth control                     | Control relationship/upload/join depth   |
| `fieldIsPresentationalOnly` | Field is UI-only (no data storage)                          | Exclude from data operations             |
| `fieldIsSidebar`            | Field positioned in sidebar                                 | Separate sidebar rendering               |
| `fieldIsID`                 | Field name is 'id'                                          | Special ID field handling                |
| `fieldIsHiddenOrDisabled`   | Field is hidden or disabled                                 | Filter from UI operations                |
| `fieldShouldBeLocalized`    | Field needs localization handling                           | Proper locale table checks               |
| `fieldIsVirtual`            | Field is virtual (computed/no DB column)                    | Skip in database transforms              |
| `tabHasName`                | Tab is named (stores data)                                  | Distinguish named vs unnamed tabs        |
| `groupHasName`              | Group is named (stores data)                                | Distinguish named vs unnamed groups      |
| `optionIsObject`            | Option is `{label, value}` format                           | Access option properties safely          |
| `optionsAreObjects`         | Checks first option only; not a mixed-array validator                                     | Batch option processing                  |
| `optionIsValue`             | Option is string value                                      | Handle string options                    |
| `valueIsValueWithRelation`  | Value is polymorphic relationship                           | Handle polymorphic relationships         |

See [Field Type Guards](field-type-guards.md) for runtime predicates and full traversal, including tabs, blocks and reusable block references. A data-name guard alone does not prove persistence.

Point values are `[longitude, latitude]`; `near` uses one comma tuple `longitude,latitude,maxDistance,minDistance` in meters. Do not use sibling `maxDistance`/`minDistance` operator keys. Geospatial support depends on the installed adapter; SQLite does not implement the same geo query surface as MongoDB/Postgres. `admin.condition` is UI-only, virtual fields are not persisted, and join fields read the owning relationship rather than storing a second relationship.
