# Space — Set components spacing.

## Overview

Set components spacing.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Avoid components clinging together and set a unified space.
- Use Space.Compact when child form components are compactly connected and the border is collapsed (After version `antd@4.24.0` Supported).
- Space is used to set the spacing between inline elements. It will add a wrapper element for each child element for inline alignment. Suitable for equidistant arrangement of multiple child elements in rows and columns.
- Flex is used to set the layout of block-level elements. It does not add a wrapper element. Suitable for layout of child elements in vertical or horizontal direction, and provides more flexibility and control.
## Input Fields

### Space Props

#### Required

- No required properties.

#### Optional

- `align`: `start` | `end` |`center` |`baseline`, Align items. Version 4.2.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props: SpaceProps })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `~~direction~~`: `vertical` | `horizontal`, The space direction. Default `horizontal`. Version 4.1.0 Deprecated.
- `orientation`: `vertical` | `horizontal`, The space direction. Default `horizontal`.
- `size`: [Size](#size) | [Size\[\]](#size), The space size. Default `small`. Version 4.1.0 | Array: 4.9.0.
- `~~split~~`: ReactNode, Set split, please use `separator` instead. Version 4.7.0.
- `separator`: ReactNode, Set separator.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props: SpaceProps })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `vertical`: boolean, Orientation, Simultaneously configure with `orientation` and prioritize `orientation`. Default false.
- `wrap`: boolean, Auto wrap line, when `horizontal` effective. Default false. Version 4.9.0.

### Space.Compact Props

#### Required

- No required properties.

#### Optional

- `block`: boolean, Option to fit width to its parent\'s width. Default false. Version 4.24.0.
- `~~direction~~`: `vertical` | `horizontal`, Set direction of layout. Default `horizontal`. Version 4.24.0 Deprecated.
- `orientation`: `vertical` | `horizontal`, Set direction of layout. Default `horizontal`.
- `size`: `large` | `middle` | `small`, Set child component size. Default `middle`. Version 4.24.0.
- `vertical`: boolean, Orientation, Simultaneously configure with `orientation` and prioritize `orientation`. Default false.

### Space.Addon Props

#### Required

- No required properties.

#### Optional

- `children`: ReactNode, Custom content. Version 5.29.0.

## Methods

No public methods.

## Usage Recommendations

Use Space to set components spacing.

## Example Code

```tsx
import { Button, Divider, Input, Space } from 'antd';

const App: React.FC = () => (
  <>
    <Space>
      <Button type="primary">Button</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
    </Space>

    <Space direction="vertical" style={{ width: '100%' }}>
      <Button block>Button 1</Button>
      <Button block>Button 2</Button>
    </Space>

    <Space split={<Divider type="vertical" />}>
      <span>Text</span>
      <span>Text</span>
      <span>Text</span>
    </Space>

    <Space.Compact>
      <Input placeholder="Input" style={{ width: '50%' }} />
      <Button type="primary">Submit</Button>
    </Space.Compact>
  </>
);
```

## Result

Renders a Space component.

## References
- Component docs: `https://ant.design/components/space` — use for API details, defaults, and official examples.