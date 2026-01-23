# Progress — Display the current progress of the operation.

## Overview

Display the current progress of the operation.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When an operation will interrupt the current interface, or it needs to run in the background for more than 2 seconds.
- When you need to display the completion percentage of an operation.
## Input Fields

### Progress Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `format`: function(percent, successPercent), The template function of the content. Default (percent) => percent + `%`.
- `percent`: number, To set the completion percentage. Default 0.
- `railColor`: string, The color of unfilled part.
- `showInfo`: boolean, Whether to display the progress value and the status icon. Default true.
- `status`: string, To set the status of the Progress, options: `success` `exception` `normal` `active`(line only).
- `strokeColor`: string, The color of progress bar.
- `strokeLinecap`: `round` | `butt` | `square`, see [stroke-linecap](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap), To set the style of the progress linecap. Default `round`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `success`: { percent: number, strokeColor: string }, Configs of successfully progress bar.
- `~~trailColor~~`: string, The color of unfilled part. Please use `railColor` instead.
- `type`: string, To set the type, options: `line` `circle` `dashboard`. Default `line`.
- `size`: number | \[number | string, number] | { width: number, height: number } | "small" | "default", Progress size. Default "default". Version 5.3.0, Object: 5.18.0.

### `type="line"`

#### Required

- No required properties.

#### Optional

- `steps`: number, The total step count.
- `rounding`: (step: number) => number, The function to round the value. Default Math.round. Version 5.24.0.
- `strokeColor`: string | string[] | { from: string; to: string; direction: string }, The color of progress bar, render `linear-gradient` when passing an object, could accept `string[]` when has `steps`. Version 4.21.0: `string[]`.
- `percentPosition`: { align: string; type: string }, Progress value position, passed in object, `align` indicates the horizontal position of the value, `type` indicates whether the value is inside or outside the progress bar. Default { align: \"end\", type: \"outer\" }. Version 5.18.0.

### `type="circle"`

#### Required

- No required properties.

#### Optional

- `steps`: number | { count: number, gap: number }, The total step count.When passing an object, `count` refers to the number of steps, and `gap` refers to the distance between them.When passing number, the default value for `gap` is 2. Version 5.16.0.
- `strokeColor`: string | { number%: string }, The color of circular progress, render gradient when passing an object.
- `strokeWidth`: number, To set the width of the circular progress, unit: percentage of the canvas width. Default 6.

### `type="dashboard"`

#### Required

- No required properties.

#### Optional

- `steps`: number | { count: number, gap: number }, The total step count.When passing an object, `count` refers to the number of steps, and `gap` refers to the distance between them.When passing number, the default value for `gap` is 2. Version 5.16.0.
- `gapDegree`: number, The gap degree of half circle, 0 ~ 295. Default 75.
- `gapPlacement`: string, The gap placement, options: `top` `bottom` `start` `end`. Default `bottom`.
- `~~gapPosition~~`: string, The gap position, options: `top` `bottom` `left` `right`, please use `gapPlacement` instead. Default `bottom`.
- `strokeWidth`: number, To set the width of the dashboard progress, unit: percentage of the canvas width. Default 6.

## Methods

No public methods.

## Usage Recommendations

Use Progress to display the current progress of the operation.

## Example Code

```tsx
import { Progress, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Progress percent={30} />
    <Progress percent={50} status="active" />
    <Progress percent={70} status="exception" />
    <Progress percent={100} />
    <Progress percent={50} showInfo={false} />

    <Space wrap>
      <Progress type="circle" percent={75} />
      <Progress type="circle" percent={70} status="exception" />
      <Progress type="circle" percent={100} />
    </Space>

    <Space wrap>
      <Progress type="dashboard" percent={75} />
      <Progress steps={5} percent={60} />
    </Space>
  </Space>
);
```

## Result

Renders a Progress component.

## References
- Component docs: `https://ant.design/components/progress` — use for API details, defaults, and official examples.