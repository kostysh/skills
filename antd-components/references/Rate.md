# Rate — Used for rating operation on something.

## Overview

Used for rating operation on something.

## When To Use

- Show evaluation.
- A quick rating operation on something.
## Input Fields

### Rate Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean, Whether to allow clear when click again. Default true.
- `allowHalf`: boolean, Whether to allow semi selection. Default false.
- `character`: ReactNode | (RateProps) => ReactNode, The custom character of rate. Default &lt;StarFilled />. Version function(): 4.4.0.
- `className`: string, The custom class name of rate.
- `count`: number, Star count. Default 5.
- `defaultValue`: number, The default value. Default 0.
- `disabled`: boolean, If read only, unable to interact. Default false.
- `keyboard`: boolean, Support keyboard operation. Default true. Version 5.18.0.
- `size`: 'small' | 'middle' | 'large', Star size. Default 'middle'.
- `style`: CSSProperties, The custom style object of rate.
- `tooltips`: [TooltipProps](/components/tooltip#api)[] | string\[], Customize tooltip by each character.
- `value`: number, The current value.
- `onBlur`: function(), Callback when component lose focus.
- `onChange`: function(value: number), Callback when select value.
- `onFocus`: function(), Callback when component get focus.
- `onHoverChange`: function(value: number), Callback when hover item.
- `onKeyDown`: function(event), Callback when keydown on component.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use Rate to used for rating operation on something.

## Example Code

```tsx
import { useState } from 'react';
import {
  FrownOutlined, HeartFilled, HeartOutlined, MehOutlined, SmileOutlined, } from '@ant-design/icons';
import { Rate, Space } from 'antd';

const App: React.FC = () => {
  const [value, setValue] = useState(3);

  return (
    <Space direction="vertical">
      <Rate />

      <Rate allowHalf defaultValue={2.5} />

      <Rate disabled defaultValue={2} />

      <Rate
        tooltips={['terrible', 'bad', 'normal', 'good', 'wonderful']}
        value={value}
        onChange={setValue}
      />
      <span>{value ? ['terrible', 'bad', 'normal', 'good', 'wonderful'][value - 1] : ''}</span>

      <Rate character={<HeartOutlined />} allowHalf />
      <Rate character="A" allowHalf />
      <Rate character="Text" allowHalf />

      <Rate
        character={({ index = 0 }) => {
          const icons = [
            <FrownOutlined key="1" />, <FrownOutlined key="2" />, <MehOutlined key="3" />, <SmileOutlined key="4" />, <SmileOutlined key="5" />, ];
          return icons[index];
        }}
      />

      <Rate allowClear defaultValue={3} />
      <Rate allowClear={false} defaultValue={3} />

      <Rate value={value} onChange={setValue} />
    </Space>
  );
};
```

## Result

Renders a Rate component.

## References
- Component docs: `https://ant.design/components/rate` — use for API details, defaults, and official examples.