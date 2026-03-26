# Timeline — Vertical display timeline.

## Overview

Vertical display timeline.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When a series of information needs to be ordered by time (ascending or descending).
- When you need a timeline to make a visual connection.
## Input Fields

### Timeline Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `items`: [Items](#Items)[], Each node of timeline.
- `mode`: `start` | `alternate` | `end`, By sending `alternate` the timeline will distribute the nodes to the left and right. Default `start`.
- `orientation`: `vertical` | `horizontal`, Set the direction of the timeline. Default `vertical`.
- `~~pending~~`: ReactNode, Set the last ghost node's existence or its content. Use `item.loading` instead. Default false.
- `~~pendingDot~~`: ReactNode, Set the dot of the last ghost node when pending is true. Use `item.icon` instead. Default &lt;LoadingOutlined /&gt;.
- `reverse`: boolean, Whether reverse nodes or not. Default false.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `titleSpan`: number | string, Set the title span space. It is the distance to the center of the dot <InlinePopover previewURL="https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*1NJISa7bpqgAAAAAR5AAAAgAerJ8AQ/original"></InlinePopover>. Default 12.
- `variant`: `filled` | `outlined`, Config style variant. Default `outlined`.

### Items Props

#### Required

- No required properties.

#### Optional

- `color`: string, Set the circle's color to `blue`, `red`, `green`, `gray` or other custom colors. Default `blue`.
- `content`: ReactNode, Set the content.
- `~~children~~`: ReactNode, Set the content. Please use `content` instead.
- `~~dot~~`: ReactNode, Customize timeline dot. Please use `icon` instead.
- `icon`: ReactNode, Customize node icon.
- `~~label~~`: ReactNode, Set the label. Please use `title` instead.
- `loading`: boolean, Set loading state. Default false.
- `placement`: `start` | `end`, Customize node placement.
- `~~position~~`: `start` | `end`, Customize node position，Please use `placement` instead.
- `title`: ReactNode, Set the title.

## Methods

No public methods.

## Usage Recommendations

Use Timeline to vertical display timeline.

## Example Code

```tsx
import { ClockCircleOutlined, SmileOutlined } from '@ant-design/icons';
import { Button, Timeline } from 'antd';

const App: React.FC = () => (
  <>
    <Timeline
      items={[
        { children: 'Create a services site 2015-09-01' }, { children: 'Solve initial network problems 2015-09-01' }, { children: 'Technical testing 2015-09-01' }, { children: 'Network problems being solved 2015-09-01' }, ]}
    />

    <Timeline
      items={[
        { color: 'green', children: 'Create a services site 2015-09-01' }, { color: 'green', children: 'Solve initial network problems 2015-09-01' }, { color: 'red', children: 'Technical testing 2015-09-01' }, { children: 'Network problems being solved 2015-09-01' }, ]}
    />

    <Timeline
      items={[
        { children: 'Create a services site 2015-09-01' }, { dot: <ClockCircleOutlined />, color: 'red', children: 'Solve initial network problems' }, { children: 'Technical testing 2015-09-01' }, { dot: <SmileOutlined />, children: 'Network problems being solved' }, ]}
    />

    <Timeline
      mode="left"
      items={[
        { label: '2015-09-01', children: 'Create a services' }, { label: '2015-09-01 09:12:11', children: 'Solve initial network problems' }, { children: 'Technical testing' }, ]}
    />

    <Timeline
      mode="alternate"
      items={[
        { children: 'Create a services site 2015-09-01' }, { children: 'Solve initial network problems 2015-09-01', color: 'green' }, { children: 'Technical testing 2015-09-01', dot: <ClockCircleOutlined /> }, { children: 'Network problems being solved 2015-09-01', color: 'red' }, ]}
    />

    <Timeline
      pending="Recording."
      items={[
        { children: 'Create a services site 2015-09-01' }, { children: 'Solve initial network problems 2015-09-01' }, { children: 'Technical testing 2015-09-01' }, ]}
    />
  </>
);
```

## Result

Renders a Timeline component.

## References
- Component docs: `https://ant.design/components/timeline` — use for API details, defaults, and official examples.