# Tour — A popup component for guiding users through a product.

## Overview

A popup component for guiding users through a product.

## When To Use

- Use when you want to guide users through a product.
## Input Fields

### Tour Props

#### Required

- No required properties.

#### Optional

- `arrow`: `boolean`|`{ pointAtCenter: boolean}`, Whether to show the arrow, including the configuration whether to point to the center of the element. Default `true`.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `closeIcon`: `React.ReactNode`, Customize close icon. Default `true`. Version 5.9.0.
- `disabledInteraction`: `boolean`, Disable interaction on highlighted area. Default `false`. Version 5.13.0.
- `gap`: `{ offset?: number | [number, number]; radius?: number }`, Control the radius of the highlighted area and the offset between highlighted area and the element. Default `{ offset?: 6 ; radius?: 2 }`. Version 5.0.0 (array type `offset`: 5.9.0).
- `keyboard`: boolean, Whether to enable keyboard shortcuts. Default true. Version 6.2.0.
- `placement`: `center` `left` `leftTop` `leftBottom` `right` `rightTop` `rightBottom` `top` `topLeft` `topRight` `bottom` `bottomLeft` `bottomRight`, Position of the guide card relative to the target element. Default `bottom`.
- `onClose`: `Function`, Callback function on shutdown.
- `onFinish`: `Function`, .
- `mask`: `boolean | { style?: React.CSSProperties; color?: string; }`, Whether to enable masking, change mask style and fill color by pass custom props. Default `true`.
- `type`: `default` `primary`, Type, affects the background color and text color. Default `default`.
- `open`: `boolean`, Open tour.
- `onChange`: `(current: number) => void`, Callback when the step changes. Current is the previous step.
- `current`: `number`, What is the current step.
- `scrollIntoViewOptions`: `boolean | ScrollIntoViewOptions`, support pass custom scrollIntoView options. Default `true`. Version 5.2.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `indicatorsRender`: `(current: number, total: number) => ReactNode`, custom indicator. Version 5.2.0.
- `actionsRender`: `(originNode: ReactNode, info: { current: number, total: number }) => ReactNode`, custom action. Version 5.25.0.
- `zIndex`: number, Tour's zIndex. Default 1001. Version 5.3.0.
- `getPopupContainer`: `(node: HTMLElement) => HTMLElement`, Set the rendering node of Tour floating layer. Default body. Version 5.12.0.

### TourStep

#### Required

- No required properties.

#### Optional

- `target`: `() => HTMLElement` | `HTMLElement`, Get the element the guide card points to. Empty makes it show in center of screen.
- `arrow`: `boolean` `{ pointAtCenter: boolean}`, Whether to show the arrow, including the configuration whether to point to the center of the element. Default `true`.
- `closeIcon`: `React.ReactNode`, Customize close icon. Default `true`. Version 5.9.0.
- `cover`: `ReactNode`, Displayed pictures or videos.
- `title`: `ReactNode`, title.
- `description`: `ReactNode`, description.
- `placement`: `center` `left` `leftTop` `leftBottom` `right` `rightTop` `rightBottom` `top` `topLeft` `topRight` `bottom` `bottomLeft` `bottomRight`, Position of the guide card relative to the target element. Default `bottom`.
- `onClose`: `Function`, Callback function on shutdown.
- `mask`: `boolean | { style?: React.CSSProperties; color?: string; }`, Whether to enable masking, change mask style and fill color by pass custom props, the default follows the `mask` property of Tour. Default `true`.
- `type`: `default` `primary`, Type, affects the background color and text color. Default `default`.
- `nextButtonProps`: `{ children: ReactNode; onClick: Function }`, Properties of the Next button.
- `prevButtonProps`: `{ children: ReactNode; onClick: Function }`, Properties of the previous button.
- `scrollIntoViewOptions`: `boolean | ScrollIntoViewOptions`, support pass custom scrollIntoView options, the default follows the `scrollIntoViewOptions` property of Tour. Default `true`. Version 5.2.0.

## Methods

No public methods.

## Usage Recommendations

Use Tour to a popup component for guiding users through a product.

## Example Code

```tsx
import { useRef, useState } from 'react';
import { Button, Space, Tour } from 'antd';
import type { TourProps } from 'antd';

const App: React.FC = () => {
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const [open, setOpen] = useState(false);

  const steps: TourProps['steps'] = [
    {
      title: 'Upload File', description: 'Put your files here.', target: () => ref1.current, }, {
      title: 'Save', description: 'Save your changes.', target: () => ref2.current, }, {
      title: 'Other Actions', description: 'Click to see other actions.', target: () => ref3.current, }, ];

  return (
    <>
      <Space>
        <Button ref={ref1}>Upload</Button>
        <Button ref={ref2} type="primary">
          Save
        </Button>
        <Button ref={ref3}>More</Button>
      </Space>

      <Button type="primary" onClick={() => setOpen(true)}>
        Begin Tour
      </Button>

      <Tour open={open} onClose={() => setOpen(false)} steps={steps} />
    </>
  );
};

const TourWithCover: React.FC = () => {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button ref={ref} onClick={() => setOpen(true)}>
        Begin Tour
      </Button>
      <Tour
        open={open}
        onClose={() => setOpen(false)}
        steps={[
          {
            title: 'Welcome', description: 'This is the first step.', cover: <img src="https://via.placeholder.com/300x150" alt="cover" />, target: () => ref.current, }, ]}
      />
    </>
  );
};

const TourPrimary: React.FC = () => {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button ref={ref} onClick={() => setOpen(true)}>
        Begin Tour
      </Button>
      <Tour
        open={open}
        onClose={() => setOpen(false)}
        type="primary"
        steps={[
          {
            title: 'Step 1', description: 'Primary type tour.', target: () => ref.current, }, ]}
      />
    </>
  );
};
```

## Result

Renders a Tour component.

## References
- Component docs: `https://ant.design/components/tour` — use for API details, defaults, and official examples.