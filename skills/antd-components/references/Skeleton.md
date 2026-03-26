# Skeleton — Provide a placeholder while you wait for content to load, or to visualize content that doesn't exist yet.

## Overview

Provide a placeholder while you wait for content to load, or to visualize content that doesn't exist yet.

## When To Use

- When a resource needs long time to load.
- When the component contains lots of information, such as List or Card.
- Only works when loading data for the first time.
- Could be replaced by Spin in any situation, but can provide a better user experience.
## Input Fields

### Skeleton Props

#### Required

- No required properties.

#### Optional

- `avatar`: boolean | [SkeletonAvatarProps](#skeletonavatarprops), Show avatar placeholder. Default false.
- `loading`: boolean, Display the skeleton when true.
- `paragraph`: boolean | [SkeletonParagraphProps](#skeletonparagraphprops), Show paragraph placeholder. Default true.
- `round`: boolean, Show paragraph and title radius when true. Default false.
- `title`: boolean | [SkeletonTitleProps](#skeletontitleprops), Show title placeholder. Default true.

### SkeletonTitleProps Props

#### Required

- No required properties.

#### Optional

- `width`: number | string | Array&lt;number | string>, Set the width of paragraph. When width is an Array, it can set the width of each row. Otherwise only set the last row width.

### SkeletonParagraphProps Props

#### Required

- No required properties.

#### Optional

- `rows`: number, Set the row count of paragraph.
- `width`: number | string | Array&lt;number | string>, Set the width of paragraph. When width is an Array, it can set the width of each row. Otherwise only set the last row width.

### Skeleton.Avatar Props

#### Required

- No required properties.

#### Optional

- `shape`: `circle` | `square`, Set the shape of avatar. Default `circle`.
- `size`: number | `large` | `small` | `default`, Set the size of avatar. Default `default`.

### Skeleton.Button Props

#### Required

- No required properties.

#### Optional

- `block`: boolean, Option to fit button width to its parent width. Default false. Version 4.17.0.
- `shape`: `circle` | `round` | `square` | `default`, Set the shape of button.
- `size`: `large` | `small` | `default`, Set the size of button.

### Skeleton.Input Props

#### Required

- No required properties.

#### Optional

- `size`: `large` | `small` | `default`, Set the size of input.

## Methods

No public methods.

## Usage Recommendations

Use Skeleton to provide a placeholder while you wait for content to load, or to visualize content that doesn't exist yet.

## Example Code

```tsx
import { useState } from 'react';
import { Skeleton, Space, Switch } from 'antd';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <Switch checked={!loading} onChange={(checked) => setLoading(!checked)} />
      <br />
      <br />

      <Skeleton loading={loading} avatar active>
        <div>
          <h4>Ant Design Title</h4>
          <p>Ant Design, a design language for background applications.</p>
        </div>
      </Skeleton>

      <Space>
        <Skeleton.Button active />
        <Skeleton.Avatar active />
        <Skeleton.Input active />
      </Space>

      <Skeleton.Image active />
    </>
  );
};
```

## Result

Renders a Skeleton component.

## References
- Component docs: `https://ant.design/components/skeleton` — use for API details, defaults, and official examples.