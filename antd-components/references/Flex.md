# Flex — A flex layout container for alignment.

## Overview

A flex layout container for alignment.

## When To Use

- Good for setting spacing between elements.
- Suitable for setting various horizontal and vertical alignments.
- Space is used to set the spacing between inline elements. It will add a wrapper element for each child element for inline alignment. Suitable for equidistant arrangement of multiple child elements in rows and columns.
- Flex is used to set the layout of block-level elements. It does not add a wrapper element. Suitable for layout of child elements in vertical or horizontal direction, and provides more flexibility and control.
## Input Fields

### Flex Props

#### Required

- No required properties.

#### Optional

- `vertical`: boolean, Is direction of the flex vertical, use `flex-direction: column`. Default `false`.
- `wrap`: [flex-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap) | boolean, Set whether the element is displayed in a single line or in multiple lines. Default nowrap. Version boolean: 5.17.0.
- `justify`: [justify-content](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content), Sets the alignment of elements in the direction of the main axis. Default normal.
- `align`: [align-items](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items), Sets the alignment of elements in the direction of the cross axis. Default normal.
- `flex`: [flex](https://developer.mozilla.org/en-US/docs/Web/CSS/flex), flex CSS shorthand properties. Default normal.
- `gap`: `small` | `middle` | `large` | string | number, Sets the gap between grids.
- `component`: React.ComponentType, custom element type. Default `div`.
- `orientation`: `horizontal` | `vertical`, direction of the flex. Default `horizontal`.

## Methods

No public methods.

## Usage Recommendations

Use Flex to a flex layout container for alignment.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Flex, Radio, Slider } from 'antd';

const App: React.FC = () => {
  const [justify, setJustify] = useState<string>('flex-start');
  const [align, setAlign] = useState<string>('flex-start');
  const [gap, setGap] = useState<number>(8);

  return (
    <>
      <Radio.Group value={justify} onChange={(e) => setJustify(e.target.value)}>
        <Radio value="flex-start">flex-start</Radio>
        <Radio value="center">center</Radio>
        <Radio value="flex-end">flex-end</Radio>
        <Radio value="space-between">space-between</Radio>
        <Radio value="space-around">space-around</Radio>
      </Radio.Group>

      <Slider min={0} max={24} value={gap} onChange={setGap} />

      <Flex justify={justify} align={align} gap={gap} style={{ height: 100 }}>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="text">Text</Button>
      </Flex>

      <Flex vertical gap="small">
        <Button type="primary">Button 1</Button>
        <Button>Button 2</Button>
        <Button type="dashed">Button 3</Button>
      </Flex>
    </>
  );
};
```

## Result

Renders a Flex component.

## References
- Component docs: `https://ant.design/components/flex` — use for API details, defaults, and official examples.