# Popover — The floating card pops up when clicking/mouse hovering over an element.

## Overview

The floating card pops up when clicking/mouse hovering over an element.

## When To Use

- A simple popup menu to provide extra information or operations.
- Comparing with `Tooltip`, besides information `Popover` card can also provide action elements like links and buttons.
## Input Fields

### Popover Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `content`: ReactNode | () => ReactNode, Content of the card.
- `title`: ReactNode | () => ReactNode, Title of the card.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.

## Methods

No public methods.

## Usage Recommendations

Use Popover to the floating card pops up when clicking/mouse hovering over an element.

## Example Code

```tsx
import { Button, Popover, Space } from 'antd';

const content = (
  <div>
    <p>Content</p>
    <p>Content</p>
  </div>
);

const App: React.FC = () => (
  <Space>
    <Popover content={content} title="Title">
      <Button type="primary">Hover me</Button>
    </Popover>

    <Popover content={content} title="Title" trigger="click">
      <Button>Click me</Button>
    </Popover>

    <Popover placement="topLeft" title="Title" content={content}>
      <Button>Top Left</Button>
    </Popover>
    <Popover placement="rightTop" title="Title" content={content}>
      <Button>Right Top</Button>
    </Popover>

    <Popover content="Content without title">
      <Button>No Title</Button>
    </Popover>
  </Space>
);
```

## Result

Renders a Popover component.

## References
- Component docs: `https://ant.design/components/popover` — use for API details, defaults, and official examples.