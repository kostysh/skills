# InputNumber — Enter a number within certain range with the mouse or keyboard.

## Overview

Enter a number within certain range with the mouse or keyboard.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When a numeric value needs to be provided.
## Input Fields

### InputNumber Props

#### Required

- No required properties.

#### Optional

- `~~addonAfter~~`: ReactNode, The label text displayed after (on the right side of) the input field, please use Space.Compact instead.
- `~~addonBefore~~`: ReactNode, The label text displayed before (on the left side of) the input field, please use Space.Compact instead.
- `changeOnBlur`: boolean, Trigger `onChange` when blur. e.g. reset value in range by blur. Default true. Version 5.11.0.
- `changeOnWheel`: boolean, Allows control with mouse wheel. Version 5.14.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `controls`: boolean | { upIcon?: React.ReactNode; downIcon?: React.ReactNode; }, Whether to show `+-` controls, or set custom arrow icons.
- `decimalSeparator`: string, Decimal separator.
- `placeholder`: string, Placeholder.
- `defaultValue`: number, The initial value.
- `disabled`: boolean, If the input is disabled. Default false.
- `formatter`: function(value: number | string, info: { userTyping: boolean, input: string }): string, Specifies the format of the value presented.
- `keyboard`: boolean, If keyboard behavior is enabled. Default true.
- `max`: number, The max value. Default [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).
- `min`: number, The min value. Default [Number.MIN_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER).
- `parser`: function(string): number, Specifies the value extracted from formatter.
- `precision`: number, The precision of input value. Will use `formatter` when config of `formatter`.
- `readOnly`: boolean, If the input is readonly. Default false.
- `status`: 'error' | 'warning', Set validation status.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `prefix`: ReactNode, The prefix icon for the Input.
- `suffix`: ReactNode, The suffix icon for the Input. Version 5.20.0.
- `size`: `large` | `middle` | `small`, The height of input box.
- `step`: number | string, The number to which the current value is increased or decreased. It can be an integer or decimal. Default 1.
- `stringMode`: boolean, Set value as string to support high precision decimals. Will return string value by `onChange`. Default false.
- `mode`: `'input' | 'spinner'`, Show input or spinner. Default `'input'`.
- `value`: number, The current value of the component.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of Input. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `onChange`: function(value: number | string | null), The callback triggered when the value is changed.
- `onPressEnter`: function(e), The callback function that is triggered when Enter key is pressed.
- `onStep`: (value: number, info: { offset: number, type: 'up' | 'down', emitter: 'handler' | 'keydown' | 'wheel' }) => void, The callback function that is triggered when click up or down buttons / Keyboard / Wheel.

### Ref Props

#### Required

- No required properties.

#### Optional

- `blur()`: -, Remove focus.
- `focus()`: (option?: { preventScroll?: boolean, cursor?: 'start' | 'end' | 'all' }), Get focus. Default cursor - 5.22.0. Version cursor - 5.22.0.
- `nativeElement`: -, The native DOM element. Default 5.17.3. Version 5.17.3.

## Methods

No public methods.

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { useState } from 'react';
import { InputNumber } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState<number | null>(3);

  return (
    <InputNumber min={1} max={10} value={value} onChange={setValue} placeholder="Please enterText" />
  );
};
```

### Scenario 2: Sizes

```tsx
import { useState } from 'react';
import { InputNumber } from 'antd';

const App: React.FC = () => {
  const [amount, setAmount] = useState<number | null>(1000);

  return (
    <>
      <InputNumber
        value={amount}
        onChange={setAmount}
        formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ', ')}
        parser={(value) => value!.replace(/¥\s?|(, *)/g, '') as any}
        min={0}
        max={1000000}
      />

      <InputNumber
        value={amount}
        onChange={setAmount}
        min={0}
        max={100}
        formatter={(value) => `${value}%`}
        parser={(value) => value!.replace('%', '') as any}
      />

      <InputNumber
        prefix="$"
        suffix="USD"
        value={amount}
        onChange={setAmount}
        min={0}
        precision={2}
      />
    </>
  );
};
```

### Scenario 3: Disabled

```tsx
import { InputNumber, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <InputNumber min={0} max={100} step={0.1} precision={1} defaultValue={10.5} placeholder="0.0" />

    <InputNumber
      min={0}
      max={10000}
      step={0.01}
      precision={2}
      defaultValue={99.99}
      placeholder="0.00"
    />

    <InputNumber
      min="0"
      max="999999999999.99"
      step="0.01"
      precision={2}
      stringMode
      defaultValue="123456789.12"
      placeholder="Text"
    />
  </Space>
);
```

### Scenario 4: High precision decimals

```tsx
import { InputNumber, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <InputNumber prefix="+" defaultValue={100} min={0} max={100} />

    <InputNumber suffix="°C" defaultValue={20} min={-50} max={50} step={0.5} />

    <InputNumber addonBefore="¥" addonAfter="CNY" defaultValue={100} min={0} />
  </Space>
);
```

### Scenario 5: Formatter

```tsx
import { InputNumber, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <InputNumber controls={false} defaultValue={10} min={0} max={100} placeholder="Text" />

    <InputNumber readOnly defaultValue={100} placeholder="Text" />

    <InputNumber disabled defaultValue={50} placeholder="Text" />

    <InputNumber
      controls={{
        upIcon: '▲', downIcon: '▼', }}
      defaultValue={10}
      min={0}
      max={100}
    />
  </Space>
);
```

### Scenario 6: Keyboard

```tsx
import { useState } from 'react';
import { InputNumber, Space } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState<number | null>(100);
  const [error, setError] = useState(false);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <InputNumber
        value={value}
        onChange={setValue}
        changeOnWheel
        min={0}
        max={1000}
        placeholder="Text"
      />

      <InputNumber
        value={value}
        onChange={setValue}
        onBlur={() => {
          setError((value ?? 0) < 0 || (value ?? 0) > 1000);
        }}
        status={error ? 'error' : undefined}
        min={0}
        max={1000}
      />

      <InputNumber
        value={value}
        onChange={setValue}
        onStep={(newValue, info) => {
          console.log(`Text ${info.type} Text:`, newValue);
        }}
        step={5}
        min={0}
        max={100}
      />
    </Space>
  );
};
```

## Usage Recommendations

Use InputNumber to enter a number within certain range with the mouse or keyboard.

## Example Code

```tsx
import { InputNumber, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical">
    <InputNumber min={1} max={10} defaultValue={3} />

    <InputNumber
      defaultValue={1000}
      formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ', ')}
      parser={(value) => value!.replace(/\$\s?|(, *)/g, '') as any}
    />

    <InputNumber min={0} max={10} step={0.1} defaultValue={0.5} />

    <InputNumber addonBefore="+" addonAfter="$" defaultValue={100} />
  </Space>
);
```

## Result

Renders an InputNumber component.

## References
- Component docs: `https://ant.design/components/input-number` — use for API details, defaults, and official examples.