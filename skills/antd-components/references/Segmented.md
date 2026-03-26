# Segmented — Display multiple options and allow users to select a single option.

## Overview

Display multiple options and allow users to select a single option.

## When To Use

- When displaying multiple options and user can select a single option;
- When switching the selected option, the content of the associated area changes.
## Input Fields

### Segmented Props

#### Required

- No required properties.

#### Optional

- `block`: boolean, Option to fit width to its parent\'s width. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Segmented component. Supports object or function.
- `defaultValue`: string | number, Default selected value.
- `disabled`: boolean, Disable all segments. Default false.
- `onChange`: function(value: string | number), The callback function that is triggered when the state changes.
- `options`: string\[] | number\[] | SegmentedItemType\[], Set children optional. Default [].
- `orientation`: `horizontal` | `vertical`, Orientation. Default `horizontal`.
- `size`: `large` | `middle` | `small`, The size of the Segmented. Default `middle`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Segmented component. Supports object or function.
- `vertical`: boolean, Orientation，Simultaneously existing with `orientation`, `orientation` takes priority. Default `false`. Version 5.21.0.
- `value`: string | number, Currently selected value.
- `shape`: `default` | `round`, shape of Segmented. Default `default`. Version 5.24.0.
- `name`: string, The `name` property of all `input[type="radio"]` children. if not set, it will fallback to a randomly generated name. Version 5.23.0.

### SegmentedItemType Props

#### Required

- No required properties.

#### Optional

- `className`: string, The additional css class.
- `disabled`: boolean, Disabled state of segmented item. Default false.
- `icon`: ReactNode, Display icon for Segmented item.
- `label`: ReactNode, Display text for Segmented item.
- `tooltip`: string | [TooltipProps](../tooltip/index.en-US.md#api), tooltip for Segmented item.
- `value`: string | number, Value for Segmented item.

## Methods

No public methods.

## Usage Recommendations

Use Segmented to display multiple options and allow users to select a single option.

## Example Code

```tsx
import { useState } from 'react';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Segmented, Space } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState<string>('Map');

  return (
    <Space direction="vertical">
      <Segmented options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']} />

      <Segmented options={['Map', 'Transit', 'Satellite']} value={value} onChange={setValue} />

      <Segmented
        options={[
          { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly', disabled: true }, { label: 'Monthly', value: 'monthly' }, ]}
      />

      <Segmented
        options={[
          { label: 'List', value: 'list', icon: <BarsOutlined /> }, { label: 'Kanban', value: 'kanban', icon: <AppstoreOutlined /> }, ]}
      />

      <Segmented
        options={[
          { value: 'list', icon: <BarsOutlined /> }, { value: 'kanban', icon: <AppstoreOutlined /> }, ]}
      />

      <Segmented size="small" options={['Daily', 'Weekly', 'Monthly']} />
      <Segmented options={['Daily', 'Weekly', 'Monthly']} />
      <Segmented size="large" options={['Daily', 'Weekly', 'Monthly']} />

      <Segmented block options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']} />

      <Segmented
        options={[
          {
            label: (
              <div style={{ padding: 4 }}>
                <div>Spring</div>
                <div>Jan-February</div>
              </div>
            ), value: 'spring', }, {
            label: (
              <div style={{ padding: 4 }}>
                <div>Summer</div>
                <div>May-February</div>
              </div>
            ), value: 'summer', }, ]}
      />
    </Space>
  );
};
```

## Result

Renders a Segmented component.

## References
- Component docs: `https://ant.design/components/segmented` — use for API details, defaults, and official examples.