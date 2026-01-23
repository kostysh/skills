# Divider — A divider line separates different content.

## Overview

A divider line separates different content.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Divide sections of an article.
- Divide inline text and links such as the operation column of table.
## Input Fields

### Divider Props

#### Required

- No required properties.

#### Optional

- `children`: ReactNode, The wrapped title.
- `className`: string, The className of container.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dashed`: boolean, Whether line is dashed. Default false.
- `orientation`: `horizontal` | `vertical`, Whether line is horizontal or vertical. Default `horizontal`.
- `~~orientationMargin~~`: string | number, The margin-left/right between the title and its closest border, while the `titlePlacement` should not be `center`, If a numeric value of type `string` is provided without a unit, it is assumed to be in pixels (px) by default Deprecated.
- `plain`: boolean, Divider text show as plain style. Default true. Version 4.2.0.
- `style`: CSSProperties, The style object of container.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `size`: `small` | `middle` | `large`, The size of divider. Only valid for horizontal layout. Version 5.25.0.
- `titlePlacement`: `start` | `end` | `center`, The position of title inside divider. Default `center`.
- `~~type~~`: `horizontal` | `vertical`, The direction type of divider. Default `horizontal` Deprecated.
- `variant`: `dashed` | `dotted` | `solid`, Whether line is dashed, dotted or solid. Default solid. Version 5.20.0.
- `vertical`: boolean, Orientation, Simultaneously configure with `orientation` and prioritize `orientation`. Default false.

## Methods

No public methods.

## Usage Recommendations

Use Divider to a divider line separates different content.

## Example Code

```tsx
import { Divider } from 'antd';

const App: React.FC = () => (
  <>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <Divider />
    <p>Sed ut perspiciatis unde omnis iste natus error sit.</p>
    <Divider dashed />
    <p>At vero eos et accusamus et iusto odio dignissimos.</p>

    <Divider>Text</Divider>
    <Divider orientation="left">Left Text</Divider>
    <Divider orientation="right">Right Text</Divider>
    <Divider orientation="left" plain>
      Plain Text
    </Divider>

    <p>
      Text
      <Divider type="vertical" />
      Link
      <Divider type="vertical" />
      Link
    </p>
  </>
);
```

## Result

Renders a Divider component.

## References
- Component docs: `https://ant.design/components/divider` — use for API details, defaults, and official examples.