# Slider — A Slider component for displaying current value and intervals in range.

## Overview

A Slider component for displaying current value and intervals in range.

## When To Use

- Used to input a value within a specified range.
## Input Fields

### Slider Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultValue`: number | \[number, number], The default value of the slider. When `range` is false, use number, otherwise, use \[number, number]. Default 0 | \[0, 0].
- `disabled`: boolean, If true, the slider will not be interactive. Default false.
- `keyboard`: boolean, Support using keyboard to move handlers. Default true. Version 5.2.0+.
- `dots`: boolean, Whether the thumb can only be dragged to tick marks. Default false.
- `included`: boolean, Takes effect when `marks` is not null. True means containment and false means coordinative. Default true.
- `marks`: object, Tick marks of Slider. The type of key must be `number`, and must be in closed interval \[min, max]. Each mark can declare its own style. Default { number: ReactNode } | { number: { style: CSSProperties, label: ReactNode } }.
- `max`: number, The maximum value the slider can slide to. Default 100.
- `min`: number, The minimum value the slider can slide to. Default 0.
- `orientation`: `horizontal` | `vertical`, Orientation. Default `horizontal`.
- `range`: boolean, Enable dual thumb mode for range selection. Default false.
- `reverse`: boolean, Reverse the component. Default false.
- `step`: number | null, The granularity the slider can step through values. Must be greater than 0, and be divisible by (max - min). When `step` is `null` and `marks` exist, valid points will only be marks, `min` and `max`. Default 1.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `tooltip`: [tooltip](#tooltip), The tooltip related props. Version 4.23.0.
- `value`: number | \[number, number], The value of slider. When `range` is false, use number, otherwise, use \[number, number].
- `vertical`: boolean, If true, the slider will be vertical. Simultaneously existing with `orientation`, `orientation` takes priority. Default false.
- `onChangeComplete`: (value) => void, Fire when `mouseup` or `keyup` is fired.
- `onChange`: (value) => void, Callback function that is fired when the user changes the slider's value.

### range Props

#### Required

- No required properties.

#### Optional

- `draggableTrack`: boolean, Whether range track can be dragged. Default false.
- `editable`: boolean, Dynamic edit nodes. Cannot be used with `draggableTrack`. Default false. Version 5.20.0.
- `minCount`: number, The minimum count of nodes. Default 0. Version 5.20.0.
- `maxCount`: number, The maximum count of nodes. Version 5.20.0.

### tooltip Props

#### Required

- No required properties.

#### Optional

- `autoAdjustOverflow`: boolean, Whether to automatically adjust the popup position. Default true. Version 5.8.0.
- `open`: boolean, If true, Tooltip will always be visible; if false, it will never be visible, even when dragging or hovering. Version 4.23.0.
- `placement`: string, Set Tooltip display position. Ref [Tooltip](/components/tooltip/). Version 4.23.0.
- `getPopupContainer`: (triggerNode) => HTMLElement, The DOM container of the Tooltip. The default behavior is to create a div element in the body. Default () => document.body. Version 4.23.0.
- `formatter`: value => ReactNode | null, Slider will pass its value to `formatter`, display its value in Tooltip, and hide the Tooltip when the returned value is null. Default IDENTITY. Version 4.23.0.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use Slider to a Slider component for displaying current value and intervals in range.

## Example Code

```tsx
import { useState } from 'react';
import { Col, InputNumber, Row, Slider, Space } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState(30);

  const marks = {
    0: '0°C', 26: '26°C', 37: '37°C', 100: {
      style: { color: '#f50' }, label: <strong>100°C</strong>, }, };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Slider defaultValue={30} />

      <Row>
        <Col span={12}>
          <Slider
            min={1}
            max={20}
            onChange={setValue}
            value={typeof value === 'number' ? value : 0}
          />
        </Col>
        <Col span={4}>
          <InputNumber min={1} max={20} value={value} onChange={(v) => setValue(v ?? 0)} />
        </Col>
      </Row>

      <Slider range defaultValue={[20, 50]} />

      <Slider marks={marks} defaultValue={37} />

      <Slider defaultValue={30} disabled />
    </Space>
  );
};
```

## Result

Renders a Slider component.

## References
- Component docs: `https://ant.design/components/slider` — use for API details, defaults, and official examples.