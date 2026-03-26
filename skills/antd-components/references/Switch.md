# Switch — Used to toggle between two states.

## Overview

Used to toggle between two states.

## When To Use

- If you need to represent the switching between two states or on-off state.
- The difference between `Switch` and `Checkbox` is that `Switch` will trigger a state change directly when you toggle it, while `Checkbox` is generally used for state marking, which should work in conjunction with submit operation.
## Input Fields

### Switch Props

#### Required

- No required properties.

#### Optional

- `checked`: boolean, Determine whether the Switch is checked. Default false.
- `checkedChildren`: ReactNode, The content to be shown when the state is checked.
- `className`: string, The additional class to Switch.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultChecked`: boolean, Whether to set the initial state. Default false.
- `defaultValue`: boolean, Alias for `defaultChecked`. Version 5.12.0.
- `disabled`: boolean, Disable switch. Default false.
- `loading`: boolean, Loading state of switch. Default false.
- `size`: string, The size of the Switch, options: `default` `small`. Default `default`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `unCheckedChildren`: ReactNode, The content to be shown when the state is unchecked.
- `value`: boolean, Alias for `checked`. Version 5.12.0.
- `onChange`: function(checked: boolean, event: Event), Trigger when the checked state is changing.
- `onClick`: function(checked: boolean, event: Event), Trigger when clicked.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use Switch to used to toggle between two states.

## Example Code

```tsx
import { useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Space, Switch } from 'antd';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <Space direction="vertical">
      <Switch defaultChecked />

      <Switch defaultChecked disabled />

      <Switch size="small" />

      <Switch checkedChildren="Text" unCheckedChildren="Text" defaultChecked />

      <Switch
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseOutlined />}
        defaultChecked
      />

      <Switch loading={loading} onChange={handleChange} />
    </Space>
  );
};
```

## Result

Renders a Switch component.

## References
- Component docs: `https://ant.design/components/switch` — use for API details, defaults, and official examples.