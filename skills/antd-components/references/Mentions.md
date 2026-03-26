# Mentions — Used to mention someone or something in an input.

## Overview

Used to mention someone or something in an input.

## When To Use

- When you need to mention someone or something.
## Input Fields

### Mentions Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, false, Version 5.13.0.
- `autoSize`: boolean | object, true | false :{ minRows: 2, maxRows: 6 }, false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, class, .
- `defaultValue`: string, .
- `filterOption`: false | (input: string, option: OptionProps) => boolean, .
- `getPopupContainer`: () => HTMLElement, HTML .
- `notFoundContent`: ReactNode, `Not Found`.
- `placement`: `top` | `bottom`, `bottom`.
- `prefix`: string | string\[], `@`.
- `split`: string, ` `.
- `status`: 'error' | 'warning', Version 4.19.0.
- `validateSearch`: (text: string, props: MentionsProps) => void, .
- `value`: string, .
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, `outlined`, Version 5.13.0 | `underlined`: 5.24.0.
- `onBlur`: () => void, .
- `onChange`: (text: string) => void, .
- `onClear`: () => void, Version 5.20.0.
- `onFocus`: () => void, .
- `onResize`: function({ width, height }), resize .
- `onSearch`: (text: string, prefix: string) => void, .
- `onSelect`: (option: OptionProps, prefix: string) => void, .
- `onPopupScroll`: (event: Event) => void, Version 5.23.0.
- `options`: [Options](#option), [], Version 5.1.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, style, .

### Option Props

#### Required

- No required properties.

#### Optional

- `value`: string, .
- `label`: React.ReactNode, Title of the option.
- `key`: string, The key value of the option.
- `disabled`: boolean, Optional.
- `className`: string, className.
- `style`: React.CSSProperties, The style of the option.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use Mentions to used to mention someone or something in an input.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Form, Mentions, Space } from 'antd';
import type { MentionsProps } from 'antd';

const { getMentions } = Mentions;

const App: React.FC = () => {
  const [value, setValue] = useState('');

  const options: MentionsProps['options'] = [
    { value: 'afc163', label: 'afc163' }, { value: 'zombieJ', label: 'zombieJ' }, { value: 'yesmeck', label: 'yesmeck' }, ];

  const onChange = (value: string) => {
    setValue(value);
  };

  const onSelect = (option: MentionsProps['options'][number]) => {
    console.log('select', option);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Mentions
        style={{ width: '100%' }}
        onChange={onChange}
        onSelect={onSelect}
        defaultValue="@afc163"
        options={options}
      />

      <Mentions autoSize style={{ width: '100%' }} options={options} />

      <Mentions
        style={{ width: '100%' }}
        placeholder="input @ to mention people"
        options={options}
        onSearch={(text) => {
          console.log('trigger search:', text);
        }}
      />

      <Mentions
        style={{ width: '100%' }}
        prefix={['@', '#']}
        placeholder="input @ to mention people, # to mention tag"
        options={[
          { value: 'afc163', label: '@afc163' }, { value: 'zombieJ', label: '@zombieJ' }, { value: 'antd', label: '#antd' }, { value: 'react', label: '#react' }, ]}
      />

      <Mentions
        style={{ width: '100%' }}
        options={[
          { value: 'afc163', label: 'afc163' }, { value: 'zombieJ', label: 'zombieJ', disabled: true }, { value: 'yesmeck', label: 'yesmeck' }, ]}
      />

      <Form
        onFinish={(values) => {
          console.log('Submit:', values);
          console.log('Mentions:', getMentions(values.comment));
        }}
      >
        <Form.Item
          name="comment"
          rules={[{ required: true, message: 'Please input your comment!' }]}
        >
          <Mentions rows={3} placeholder="You can use @ to mention" options={options} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
};
```

## Result

Renders a Mentions component.

## References
- Component docs: `https://ant.design/components/mentions` — use for API details, defaults, and official examples.