# Badge — Small numerical value or status descriptor for UI elements.

## Overview

Small numerical value or status descriptor for UI elements.

## When To Use

- Badge normally appears in proximity to notifications or user avatars with eye-catching appeal, typically displaying unread messages count.
## Input Fields

### Badge Props

#### Required

- No required properties.

#### Optional

- `color`: string, Customize Badge dot color.
- `count`: ReactNode, Number to show in badge.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dot`: boolean, Whether to display a red dot instead of `count`. Default false.
- `offset`: \[number, number], Set offset of the badge dot.
- `overflowCount`: number, Max count to show. Default 99.
- `showZero`: boolean, Whether to show badge when `count` is zero. Default false.
- `size`: `default` | `small`, If `count` is set, `size` sets the size of badge.
- `status`: `success` | `processing` | `default` | `error` | `warning`, Set Badge as a status dot.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `text`: ReactNode, If `status` is set, `text` sets the display text of the status `dot`.
- `title`: string, Text to show when hovering over the badge.

### Badge.Ribbon Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `color`: string, Customize Ribbon color.
- `placement`: `start` | `end`, The placement of the Ribbon, `start` and `end` follow text direction (RTL or LTR). Default `end`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `text`: ReactNode, Content inside the Ribbon.

## Methods

No public methods.

## Usage Recommendations

Use Badge to small numerical value or status descriptor for UI elements.

## Example Code

```tsx
import { useState } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Avatar, Badge, Space, Switch } from 'antd';

const App: React.FC = () => {
  const [count, setCount] = useState(5);
  const [show, setShow] = useState(true);

  return (
    <Space direction="vertical">
      <Space size="large">
        <Badge count={5}>
          <Avatar shape="square" size="large" />
        </Badge>
        <Badge count={0} showZero>
          <Avatar shape="square" size="large" />
        </Badge>
        <Badge count={<ClockCircleOutlined style={{ color: '#f5222d' }} />}>
          <Avatar shape="square" size="large" />
        </Badge>
      </Space>

      <Badge dot>
        <a href="#">Link something</a>
      </Badge>

      <Space>
        <Badge count={99}>
          <Avatar shape="square" size="large" />
        </Badge>
        <Badge count={100}>
          <Avatar shape="square" size="large" />
        </Badge>
        <Badge count={1000} overflowCount={999}>
          <Avatar shape="square" size="large" />
        </Badge>
      </Space>

      <Space>
        <Badge status="success" text="Success" />
        <Badge status="error" text="Error" />
        <Badge status="default" text="Default" />
        <Badge status="processing" text="Processing" />
        <Badge status="warning" text="Warning" />
      </Space>

      <Badge.Ribbon text="Ribbon" color="pink">
        <div style={{ padding: 20, background: '#f5f5f5' }}>Content</div>
      </Badge.Ribbon>
    </Space>
  );
};
```

## Result

Renders a Badge component.

## References
- Component docs: `https://ant.design/components/badge` — use for API details, defaults, and official examples.