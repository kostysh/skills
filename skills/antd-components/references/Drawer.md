# Drawer — A panel that slides out from the edge of the screen.

## Overview

A panel that slides out from the edge of the screen.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Use a Form to create or edit a set of information.
- Processing subtasks. When subtasks are too heavy for a Popover and we still want to keep the subtasks in the context of the main task, Drawer comes very handy.
- When the same Form is needed in multiple places.
## Input Fields

### rootClassName Props

#### Required

- No required properties.

#### Optional

- `afterOpenChange`: function(open), Callback after the animation ends when switching drawers.
- `className`: string, Config Drawer Panel className. Use `rootClassName` if want to config top DOM style.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Drawer component. Supports object or function.
- `closable`: boolean | { closeIcon?: React.ReactNode; disabled?: boolean; placement?: 'start' | 'end' }, Whether to show a close button. The position can be configured with `placement`. Default true. Version placement: 5.28.0.
- `~~destroyOnClose~~`: boolean, Whether to unmount child components on closing drawer or not. Default false Deprecated.
- `destroyOnHidden`: boolean, Whether to unmount child components on closing drawer or not. Default false. Version 5.25.0.
- `extra`: ReactNode, Extra actions area at corner. Version 4.17.0.
- `footer`: ReactNode, The footer for Drawer.
- `forceRender`: boolean, Pre-render Drawer component forcibly. Default false.
- `focusable`: `{ trap?: boolean, focusTriggerAfterClose?: boolean }`, Configuration for focus management in the Drawer. Version 6.2.0.
- `getContainer`: HTMLElement | () => HTMLElement | Selectors | false, mounted node and display window for Drawer. Default body.
- `~~height~~`: string | number, Placement is `top` or `bottom`, height of the Drawer dialog, please use `size` instead. Default 378.
- `keyboard`: boolean, Whether support press esc to close. Default true.
- `mask`: boolean | `{ enabled?: boolean, blur?: boolean }`, Mask effect. Default true.
- `maskClosable`: boolean, Clicking on the mask (area outside the Drawer) to close the Drawer or not. Default true.
- `placement`: `top` | `right` | `bottom` | `left`, The placement of the Drawer. Default `right`.
- `push`: boolean | { distance: string | number }, Nested drawers push behavior. Default { distance: 180 }. Version 4.5.0+.
- `resizable`: boolean | [ResizableConfig](#resizableconfig), Enable resizable by dragging. Version boolean: 6.1.0.
- `rootStyle`: CSSProperties, Style of wrapper element which **contains mask** compare to `style`.
- `size`: 'default' | 'large' | number | string, preset size of drawer, default `378px` and large `736px`, or a custom number. Default 'default'. Version 4.17.0, string: 6.2.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Drawer component. Supports object or function.
- `title`: ReactNode, The title for Drawer.
- `loading`: boolean, Show the Skeleton. Default false. Version 5.17.0.
- `open`: boolean, Whether the Drawer dialog is visible or not. Default false.
- `~~width~~`: string | number, Width of the Drawer dialog, please use `size` instead. Default 378.
- `zIndex`: number, The `z-index` of the Drawer. Default 1000.
- `onClose`: function(e), Specify a callback that will be called when a user clicks mask, close button or Cancel button.
- `drawerRender`: (node: ReactNode) => ReactNode, Custom drawer content render. Version 5.18.0.

### ResizableConfig Props

#### Required

- No required properties.

#### Optional

- `onResizeStart`: () => void, Callback when resize starts. Version 6.0.0.
- `onResize`: (size: number) => void, Callback during resizing. Version 6.0.0.
- `onResizeEnd`: () => void, Callback when resize ends. Version 6.0.0.

## Methods

No public methods.

## Usage Recommendations

Use Drawer to a panel that slides out from the edge of the screen.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Drawer, Space } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Drawer
      </Button>
      <Drawer
        title="Basic Drawer"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => setOpen(false)}>
              OK
            </Button>
          </Space>
        }
      >
        <p>Some contents.</p>
      </Drawer>
    </>
  );
};
```

## Result

Renders a Drawer component.

## References
- Component docs: `https://ant.design/components/drawer` — use for API details, defaults, and official examples.