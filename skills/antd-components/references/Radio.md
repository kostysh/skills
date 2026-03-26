# Radio — Used to select a single state from multiple options.

## Overview

Used to select a single state from multiple options.

## When To Use

- Used to select a single state from multiple options.
- The difference from Select is that Radio is visible to the user and can facilitate the comparison of choice, which means there shouldn't be too many of them.
## Input Fields

### Radio/Radio.Button

#### Required

- No required properties.

#### Optional

- `checked`: boolean, Specifies whether the radio is selected. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function. Version 6.0.0.
- `defaultChecked`: boolean, Specifies the initial state: whether or not the radio is selected. Default false.
- `disabled`: boolean, Disable radio. Default false.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function. Version 6.0.0.
- `value`: any, According to value for comparison, to determine whether the selected.

### Radio Props

#### Required

- No required properties.

#### Optional

- `block`: boolean, RadioGroup, false, Version 5.21.0.
- `buttonStyle`: `outline` | `solid`, RadioButton,   `outline`.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function. Version 6.0.0.
- `defaultValue`: any, .
- `disabled`: boolean, Disable radio. Default false.
- `name`: string, RadioGroup  `input[type="radio"]`  `name` ., .
- `options`: string\[] | number\[] | Array<[CheckboxOptionType](#checkboxoptiontype)>, .
- `optionType`: `default` | `button`, Radio `options`, `default`, Version 4.4.0.
- `orientation`: `horizontal` | `vertical`, `horizontal`.
- `size`: `large` | `middle` | `small`, .
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function. Version 6.0.0.
- `value`: any, According to value for comparison, to determine whether the selected.
- `vertical`: boolean, true, Radio Group . `orientation`, `orientation`, false.
- `onChange`: function(e:Event), .
- `blur()`: , Remove focus.
- `focus()`: , Get focus.

### CheckboxOptionType Props

#### Required

- No required properties.

#### Optional

- `label`: `string`, The text used to display as the Radio option. Version 4.4.0.
- `value`: `string` | `number` | `boolean`, The value associated with the Radio option. Version 4.4.0.
- `style`: `React.CSSProperties`, The style to apply to the Radio option. Version 4.4.0.
- `className`: `string`, className of the Radio option. Version 5.25.0.
- `disabled`: `boolean`, Specifies whether the Radio option is disabled. Default `false`. Version 4.4.0.
- `title`: `string`, Adds the Title attribute value. Version 4.4.0.
- `id`: `string`, Adds the Radio Id attribute value. Version 4.4.0.
- `onChange`: `(e: CheckboxChangeEvent) => void;`, Triggered when the value of the Radio Group changes. Version 4.4.0.
- `required`: `boolean`, Specifies whether the Radio option is required. Default `false`. Version 4.4.0.

## Methods

No public methods.

## Usage Recommendations

Use Radio to used to select a single state from multiple options.

## Example Code

```tsx
import { useState } from 'react';
import { Radio, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState(1);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  return (
    <Space direction="vertical">
      <Radio.Group onChange={onChange} value={value}>
        <Radio value={1}>A</Radio>
        <Radio value={2}>B</Radio>
        <Radio value={3}>C</Radio>
        <Radio value={4}>D</Radio>
      </Radio.Group>

      <Radio.Group
        options={[
          { label: 'Apple', value: 'Apple' }, { label: 'Pear', value: 'Pear' }, { label: 'Orange', value: 'Orange', disabled: true }, ]}
        value="Apple"
      />

      <Radio.Group defaultValue="a" buttonStyle="solid">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
      </Radio.Group>
    </Space>
  );
};
```

## Result

Renders a Radio component.

## References
- Component docs: `https://ant.design/components/radio` — use for API details, defaults, and official examples.