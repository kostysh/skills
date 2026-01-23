# Empty — Empty state placeholder.

## Overview

Empty state placeholder.

## When To Use

- When there is no data provided, display for friendly tips.
- User tutorial to create something in fresh new situation.
## Input Fields

### Empty Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `description`: ReactNode, Customize description.
- `image`: ReactNode, Customize image. Will treat as image url when string provided. Default `Empty.PRESENTED_IMAGE_DEFAULT`.
- `imageStyle`: CSSProperties, The style of image.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.

## Methods

No public methods.

## Usage Recommendations

Use Empty to empty state placeholder.

## Example Code

```tsx
import { Button, ConfigProvider, Empty } from 'antd';

const App: React.FC = () => (
  <>
    <Empty />

    <Empty description="No data available" />

    <Empty description={false} />

    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

    <Empty
      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
      imageStyle={{ height: 60 }}
      description={
        <span>
          Customize <a href="#API">Description</a>
        </span>
      }
    >
      <Button type="primary">Create Now</Button>
    </Empty>

    <ConfigProvider renderEmpty={() => <Empty description="Text" />}></ConfigProvider>
  </>
);
```

## Result

Renders an Empty component.

## References
- Component docs: `https://ant.design/components/empty` — use for API details, defaults, and official examples.