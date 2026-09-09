# Payload Field Type Guards Reference

Use the installed exported guards directly; do not copy their generic declarations. This reference describes 3.88.0 runtime predicates, whose TypeScript narrowing is not validation of arbitrary external input. See [FIELDS.md](fields.md#field-type-guards) for quick reference table of all guards.

## Structural Guards

### fieldHasSubFields

Checks if field contains nested fields (group, array, row, or collapsible).

```ts
import type { Field } from 'payload'
import { fieldHasSubFields } from 'payload'

function traverseFields(fields: Field[]): void {
  fields.forEach((field) => {
    if (fieldHasSubFields(field)) {
      // Safe to access field.fields
      traverseFields(field.fields)
    }
  })
}
```


**Common Pattern - Exclude Arrays:**

```ts
if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
  // Groups, rows, collapsibles only (not arrays)
}
```

### fieldIsArrayType

Checks if field type is `'array'`.

```ts
import { fieldIsArrayType } from 'payload'

if (fieldIsArrayType(field)) {
  // field.type === 'array'
  console.log(`Min rows: ${field.minRows}`)
  console.log(`Max rows: ${field.maxRows}`)
}
```


### fieldIsBlockType

Checks if field type is `'blocks'`.

```ts
import { fieldIsBlockType } from 'payload'

if (fieldIsBlockType(field)) {
  // field.type === 'blocks'
  field.blocks.forEach((block) => {
    console.log(`Block: ${block.slug}`)
  })
}
```


**Common Pattern - Distinguish Containers:**

```ts
if (fieldIsArrayType(field)) {
  // Handle array rows
} else if (fieldIsBlockType(field)) {
  // Handle block types
}
```

### fieldIsGroupType

Checks if field type is `'group'`.

```ts
import { fieldIsGroupType } from 'payload'

if (fieldIsGroupType(field)) {
  // field.type === 'group'
  console.log(`Interface: ${field.interfaceName}`)
}
```


## Capability Guards

### fieldSupportsMany

Checks if field can have multiple values (select, relationship, or upload with `hasMany`).

```ts
import { fieldSupportsMany } from 'payload'

if (fieldSupportsMany(field)) {
  // field.type is 'select' | 'relationship' | 'upload'
  // Safe to check field.hasMany
  if (field.hasMany) {
    console.log('Field accepts multiple values')
  }
}
```


### fieldHasMaxDepth

Checks if field is relationship/upload/join with numeric `maxDepth` property.

```ts
import { fieldHasMaxDepth } from 'payload'

if (fieldHasMaxDepth(field)) {
  // field.type is 'upload' | 'relationship' | 'join'
  // AND field.maxDepth is number
  const remainingDepth = field.maxDepth - currentDepth
}
```


### fieldShouldBeLocalized

Checks if field needs localization handling (accounts for parent localization).

```ts
import { fieldShouldBeLocalized } from 'payload'

function processField(field: Field, parentIsLocalized: boolean) {
  if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
    // Create locale-specific table or index
  }
}
```


```ts
// Accounts for parent localization
if (fieldShouldBeLocalized({ field, parentIsLocalized: false })) {
  /* ... */
}
```

### fieldIsVirtual

Checks if field is virtual (computed or virtual relationship).

```ts
import { fieldIsVirtual } from 'payload'

if (fieldIsVirtual(field)) {
  // field.virtual is truthy
  if (typeof field.virtual === 'string') {
    // Virtual relationship path
    console.log(`Virtual path: ${field.virtual}`)
  } else {
    // Computed virtual field (uses hooks)
  }
}
```


## Data Guards

### fieldAffectsData

**Most commonly used guard.** Checks for a name and excludes UI fields. Virtual fields also pass, so check `fieldIsVirtual` separately before assuming persistence.

```ts
import { fieldAffectsData } from 'payload'

function generateSchema(fields: Field[]) {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      // Safe to access field.name
      schema[field.name] = getFieldType(field)
    }
  })
}
```


**Pattern - Data Fields Only:**

```ts
const namedFields = fields.filter(fieldAffectsData) // Includes virtual fields
```

### fieldIsPresentationalOnly

Checks if field is UI-only (type `'ui'`).

```ts
import { fieldIsPresentationalOnly } from 'payload'

if (fieldIsPresentationalOnly(field)) {
  // field.type === 'ui'
  // Skip in data operations, GraphQL schema, etc.
  return
}
```


### fieldIsID

Checks if field name is exactly `'id'`.

```ts
import { fieldIsID } from 'payload'

if (fieldIsID(field)) {
  // field.name === 'id'
  // Special handling for ID field
}
```


### fieldIsHiddenOrDisabled

Checks `field.hidden` or `admin.disabled`, not `admin.hidden`. Do not treat its return type as proof that an admin.hidden property actually exists.

```ts
import { fieldIsHiddenOrDisabled } from 'payload'

const visibleFields = fields.filter((field) => !fieldIsHiddenOrDisabled(field))
```


## Layout Guards

### fieldIsSidebar

Checks if field is positioned in sidebar.

```ts
import { fieldIsSidebar } from 'payload'

const [mainFields, sidebarFields] = fields.reduce(
  ([main, sidebar], field) => {
    if (fieldIsSidebar(field)) {
      return [main, [...sidebar, field]]
    }
    return [[...main, field], sidebar]
  },
  [[], []],
)
```


## Tab & Group Guards

### tabHasName

Checks if tab is named (stores data under tab name).

```ts
import { tabHasName } from 'payload'

tabs.forEach((tab) => {
  if (tabHasName(tab)) {
    // tab.name exists
    dataPath.push(tab.name)
  }
  // Process tab.fields
})
```


### groupHasName

Checks if group is named (stores data under group name).

```ts
import { groupHasName } from 'payload'

if (groupHasName(group)) {
  // group.name exists
  return data[group.name]
}
```


## Option & Value Guards

### optionIsObject

Checks if option is object format `{label, value}` vs string.

```ts
import { optionIsObject } from 'payload'

field.options.forEach((option) => {
  if (optionIsObject(option)) {
    console.log(`${option.label}: ${option.value}`)
  } else {
    console.log(option) // string value
  }
})
```


### optionsAreObjects

Checks only whether the first option is an object. It does not validate all elements in a mixed external array.

```ts
import { optionIsObject } from 'payload'

if (field.options.every(optionIsObject)) {
  // Every configured option passed the per-option guard
  const labels = field.options.map((opt) => opt.label)
}
```


### optionIsValue

Checks if option is string value (not object).

```ts
import { optionIsValue } from 'payload'

if (optionIsValue(option)) {
  // option is string
  const value = option
}
```


### valueIsValueWithRelation

Checks if relationship value is polymorphic format `{relationTo, value}`.

```ts
import { valueIsValueWithRelation } from 'payload'

if (valueIsValueWithRelation(fieldValue)) {
  // fieldValue.relationTo exists
  // fieldValue.value exists
  console.log(`Related to ${fieldValue.relationTo}: ${fieldValue.value}`)
}
```


## Common Patterns

### Recursive Field Traversal

```ts
import type { Block, Field } from 'payload'
import { fieldHasSubFields } from 'payload'

export function traverseFields(
  fields: Field[],
  callback: (field: Field) => void,
  resolveBlock: (slug: string) => Block | undefined,
  seen = new Set<Field>(),
): void {
  for (const field of fields) {
    if (seen.has(field)) continue
    seen.add(field)
    callback(field)
    if (fieldHasSubFields(field)) traverseFields(field.fields, callback, resolveBlock, seen)
    if (field.type === 'tabs') {
      for (const tab of field.tabs) traverseFields(tab.fields, callback, resolveBlock, seen)
    }
    if (field.type === 'blocks') {
      for (const entry of [...field.blocks, ...(field.blockReferences ?? [])]) {
        const block = typeof entry === 'string' ? resolveBlock(entry) : entry
        if (!block) throw new Error(`Unresolved block reference: ${entry}`)
        traverseFields(block.fields, callback, resolveBlock, seen)
      }
    }
  }
}
```

The resolver uses the host config's block registry. This visits each field configuration object once and guards recursive references. A data-path traversal instead needs paths and a branch-local cycle guard so reused blocks are processed at each data location. The earlier subfields-only examples deliberately cover only group/array/row/collapsible and are not full-tree visitors.

### Filter Data-Bearing Fields

```ts
import { fieldAffectsData, fieldIsVirtual } from 'payload'

const dataFields = fields.filter(
  (field) =>
    fieldAffectsData(field) && !fieldIsVirtual(field),
)
```

### Container Type Switching

```ts
import { fieldIsArrayType, fieldIsBlockType, fieldHasSubFields } from 'payload'

if (fieldIsArrayType(field)) {
  // Handle array-specific logic
} else if (fieldIsBlockType(field)) {
  // Handle blocks-specific logic
} else if (fieldHasSubFields(field)) {
  // Handle group/row/collapsible
}
```

### Safe Property Access

```ts
import { fieldSupportsMany, fieldHasMaxDepth } from 'payload'

// Without guard - TypeScript error
// if (field.hasMany) { /* ... */ }

// With guard - safe access
if (fieldSupportsMany(field) && field.hasMany) {
  console.log('Multiple values supported')
}

if (fieldHasMaxDepth(field)) {
  const depth = field.maxDepth // TypeScript knows this is number
}
```

## Type Preservation

Generic field guards preserve server/client conditional narrowing in 3.88.0; check the installed signature for each non-generic or versioned guard:

```ts
import type { ClientField, Field } from 'payload'
import { fieldHasSubFields } from 'payload'

function processServerField(field: Field) {
  if (fieldHasSubFields(field)) {
    // field is Field & FieldWithSubFields (not ClientField)
  }
}

function processClientField(field: ClientField) {
  if (fieldHasSubFields(field)) {
    // field is ClientField & FieldWithSubFieldsClient
  }
}
```

Hidden/disabled fields may still persist: do not discard them during database transformations merely to match Admin visibility. Guards expect sanitized/typed field configs; validate unknown JSON before invoking them. `fieldShouldBeLocalized` accounts for parent localization; do not replace it with the deprecated simple `fieldIsLocalized` predicate.
