# Input — Through mouse or keyboard input content, it is the most basic form field wrapper.

## Overview

Through mouse or keyboard input content, it is the most basic form field wrapper.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- A user input in a form field is needed.
- A search input is required.
## Input Fields

### Input Props

#### Required

- No required properties.

#### Optional

- `~~addonAfter~~`: ReactNode, The label text displayed after (on the right side of) the input field, please use Space.Compact instead.
- `~~addonBefore~~`: ReactNode, The label text displayed before (on the left side of) the input field, please use Space.Compact instead.
- `allowClear`: boolean | { clearIcon: ReactNode }, If allow to remove input content with clear icon. Default false.
- `~~bordered~~`: boolean, Whether has border style, please use `variant` instead. Default true. Version 4.5.0.
- `classNames`: Record<[SemanticDOM](#semantic-input), string> | (info: { props })=> Record<[SemanticDOM](#semantic-input), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `count`: [CountConfig](#countconfig), Character count config. Version 5.10.0.
- `defaultValue`: string, The initial input content.
- `disabled`: boolean, Whether the input is disabled. Default false.
- `id`: string, The ID for input.
- `maxLength`: number, The maximum number of characters in Input.
- `prefix`: ReactNode, The prefix icon for the Input.
- `showCount`: boolean | { formatter: (info: { value: string, count: number, maxLength?: number }) => ReactNode }, Whether to show character count. Default false. Version 4.18.0 info.value: 4.23.0.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `styles`: Record<[SemanticDOM](#semantic-input), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-input), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `size`: `large` | `middle` | `small`, The size of the input box. Note: in the context of a form, the `middle` size is used.
- `suffix`: ReactNode, The suffix icon for the Input.
- `type`: string, The type of input, see: [MDN](https://developer.mozilla.org/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types)( use `Input.TextArea` instead of `type="textarea"`). Default `text`.
- `value`: string, The input content value.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of Input. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `onChange`: function(e), Callback when user input.
- `onPressEnter`: function(e), The callback function that is triggered when Enter key is pressed.
- `onClear`: () => void, Callback when click the clear button. Version 5.20.0.

### Input.TextArea Props

#### Required

- No required properties.

#### Optional

- `autoSize`: boolean | object, Height auto size feature, can be set to true | false or an object { minRows: 2, maxRows: 6 }. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-textarea), string> | (info: { props }) => Record<[SemanticDOM](#semantic-textarea), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `styles`: Record<[SemanticDOM](#semantic-textarea), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-textarea), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.

### Input.Search Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-search), string> | (info: { props }) => Record<[SemanticDOM](#semantic-search), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `enterButton`: ReactNode, false displays the default button color, true uses the primary color, or you can provide a custom button. Conflicts with addonAfter. Default false.
- `loading`: boolean, Search box with loading. Default false.
- `onSearch`: function(value, event, { source: "input" | "clear" }), The callback function triggered when you click on the search-icon, the clear-icon or press the Enter key.
- `styles`: Record<[SemanticDOM](#semantic-search), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-search), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.

### Input.Password Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-password), string>, Semantic DOM class.
- `iconRender`: (visible) => ReactNode, Custom toggle button. Default (visible) => (visible ? &lt;EyeOutlined /> : &lt;EyeInvisibleOutlined />). Version 4.3.0.
- `styles`: Record<[SemanticDOM](#semantic-password), CSSProperties>, Semantic DOM style.
- `visibilityToggle`: boolean | [VisibilityToggle](#visibilitytoggle), Whether show toggle button or control password visible. Default true.

### Input.OTP Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-otp), string> | (info: { props }) => Record<[SemanticDOM](#semantic-otp), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultValue`: string, Default value.
- `disabled`: boolean, Whether the input is disabled. Default false.
- `formatter`: (value: string) => string, Format display, blank fields will be filled with ` `.
- `separator`: ReactNode |((i: number) => ReactNode), render the separator after the input box of the specified index. Version 5.24.0.
- `mask`: boolean | string, Custom display, the original value will not be modified. Default `false`. Version `5.17.0`.
- `length`: number, The number of input elements. Default 6.
- `status`: 'error' | 'warning', Set validation status.
- `styles`: Record<[SemanticDOM](#semantic-otp), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-otp), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `size`: `small` | `middle` | `large`, The size of the input box. Default `middle`.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of Input. Default `outlined`. Version `underlined`: 5.24.0.
- `value`: string, The input content value.
- `onChange`: (value: string) => void, Trigger when all the fields are filled.
- `onInput`: (value: string[]) => void, Trigger when the input value changes. Version `5.22.0`.

### VisibilityToggle Props

#### Required

- No required properties.

#### Optional

- `visible`: boolean, Whether the password is show or hide. Default false. Version 4.24.0.
- `onVisibleChange`: (visible) => void, Callback executed when visibility of the password is changed. Version 4.24.0.

## Methods

- `blur`:
- `focus`: (option?: { preventScroll?: boolean, cursor?: 'start' | 'end' | 'all' }), Get focus. Default option - 4.10.0. Version option - 4.10.0.

## Common Scenario Examples

### Scenario 1: Basic usage

```tsx
import { Input } from 'antd';

const App: React.FC = () => (
  <Input placeholder="Please enterText" onChange={(e) => console.log(e.target.value)} />
);
```

### Scenario 2: Three sizes of Input

```tsx
import { useState } from 'react';
import { Input } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState('');

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Text"
      allowClear
      onClear={() => setValue('')}
      maxLength={20}
      showCount
    />
  );
};
```

### Scenario 3: Compact Style

```tsx
import { DollarOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Input } from 'antd';

const App: React.FC = () => (
  <>
    <Input prefix={<UserOutlined />} placeholder="Username" />
    <Input prefix={<DollarOutlined />} suffix="CNY" placeholder="Text" />
    <Input prefix={<LockOutlined />} suffix="strong" placeholder="PasswordText" />
  </>
);
```

### Scenario 4: Search box

```tsx
import { useState } from 'react';
import { Input } from 'antd';

const App: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <>
      <Input.TextArea
        rows={4}
        placeholder="Please enterText"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Text" />

      <Input.TextArea rows={4} maxLength={200} showCount placeholder="Up to 200 Text" />
    </>
  );
};
```

### Scenario 5: Search box with loading

```tsx
import { Input } from 'antd';

const App: React.FC = () => (
  <>
    <Input.Search placeholder="Search." onSearch={(value) => console.log('Search:', value)} />

    <Input.Search
      placeholder="Search."
      enterButton="Search"
      onSearch={(value) => console.log('Search:', value)}
    />

    <Input.Search placeholder="Search." loading enterButton="Search" />
  </>
);
```

### Scenario 6: TextArea

```tsx
import { Input, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Input.Password placeholder="Please enterPassword" />

    <Input.Password
      placeholder="TextPassword"
      visibilityToggle={{
        visible: true, onVisibleChange: (visible) => console.log('visible:', visible), }}
    />

    <Input.OTP length={6} placeholder="Text" />
    <Input.OTP length={6} formatter={(str) => str.toUpperCase()} />
    <Input.OTP length={4} mask showInput />
  </Space>
);
```

## Usage Recommendations

Use Input to through mouse or keyboard input content, it is the most basic form field wrapper.

## Example Code

```tsx
import { Input, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Input placeholder="Basic usage" />
    <Input.Search placeholder="Search" enterButton />
    <Input.Password placeholder="Password" />
    <Input.TextArea rows={4} placeholder="TextArea" />
  </Space>
);
```

## Result

Renders an Input component.

## References
- Component docs: `https://ant.design/components/input` — use for API details, defaults, and official examples.