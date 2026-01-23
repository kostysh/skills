# Tag — Used for marking and categorization.

## Overview

Used for marking and categorization.

## When To Use

- It can be used to tag by dimension or property.
- When categorizing.
## Input Fields

### Tag Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `closeIcon`: ReactNode, Custom close icon. 5.7.0: close button will be hidden when setting to `null` or `false`. Default false. Version 4.4.0.
- `color`: string, Color of the Tag.
- `disabled`: boolean, Whether the tag is disabled. Default false. Version 6.0.0.
- `href`: string, The address to jump when clicking, when this property is specified, the `tag` component will be rendered as an `<a>` tag. Version 6.0.0.
- `icon`: ReactNode, Set the icon of tag.
- `onClose`: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void, Callback executed when tag is closed (can be prevented by `e.preventDefault()`).
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `target`: string, Same as target attribute of a, works when href is specified. Version 6.0.0.
- `variant`: `'filled' | 'solid' | 'outlined'`, Variant of the tag. Default `'filled'`. Version 6.0.0.

### Tag.CheckableTag Props

#### Required

- No required properties.

#### Optional

- `checked`: boolean, Checked status of Tag. Default false.
- `icon`: ReactNode, Set the icon of tag. Version 5.27.0.
- `onChange`: (checked) => void, Callback executed when Tag is checked/unchecked.

### Tag.CheckableTagGroup Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-group), string> | (info: { props }) => Record<[SemanticDOM](#semantic-group), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultValue`: `string | number | Array<string | number> | null`, Initial value.
- `disabled`: `boolean`, Disable check/uncheck.
- `multiple`: `boolean`, Multiple select mode.
- `options`: `Array<{ label: ReactNode; value: string | number } | string | number>`, Option list.
- `styles`: Record<[SemanticDOM](#semantic-group), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-group), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `value`: `string | number | Array<string | number> | null`, Value of checked tag(s).
- `onChange`: `(value: string | number | Array<string | number> | null) => void`, Callback when Tag is checked/unchecked.

## Methods

No public methods.

## Usage Recommendations

Use Tag to used for marking and categorization.

## Example Code

```tsx
import { useState } from 'react';
import { TwitterOutlined, YoutubeOutlined } from '@ant-design/icons';
import { Divider, Space, Tag } from 'antd';

const App: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>(['Books']);

  const handleChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [.selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
  };

  return (
    <Space direction="vertical">
      <Space>
        <Tag>Tag 1</Tag>
        <Tag>
          <a href="#">Link</a>
        </Tag>
        <Tag closable onClose={() => console.log('close')}>
          Tag 2
        </Tag>
      </Space>

      <Space wrap>
        <Tag color="magenta">magenta</Tag>
        <Tag color="red">red</Tag>
        <Tag color="volcano">volcano</Tag>
        <Tag color="orange">orange</Tag>
        <Tag color="gold">gold</Tag>
        <Tag color="lime">lime</Tag>
        <Tag color="green">green</Tag>
        <Tag color="cyan">cyan</Tag>
        <Tag color="blue">blue</Tag>
        <Tag color="geekblue">geekblue</Tag>
        <Tag color="purple">purple</Tag>
      </Space>

      <Space wrap>
        <Tag color="success">success</Tag>
        <Tag color="processing">processing</Tag>
        <Tag color="error">error</Tag>
        <Tag color="warning">warning</Tag>
        <Tag color="default">default</Tag>
      </Space>

      <Space>
        <Tag icon={<TwitterOutlined />} color="#55acee">
          Twitter
        </Tag>
        <Tag icon={<YoutubeOutlined />} color="#cd201f">
          Youtube
        </Tag>
      </Space>

      <Divider orientation="left">CheckableTag</Divider>
      <Space>
        {['Movies', 'Books', 'Music', 'Sports'].map((tag) => (
          <Tag.CheckableTag
            key={tag}
            checked={selectedTags.includes(tag)}
            onChange={(checked) => handleChange(tag, checked)}
          >
            {tag}
          </Tag.CheckableTag>
        ))}
      </Space>
    </Space>
  );
};
```

## Result

Renders a Tag component.

## References
- Component docs: `https://ant.design/components/tag` — use for API details, defaults, and official examples.