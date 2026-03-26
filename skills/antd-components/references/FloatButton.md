# FloatButton — A button that floats at the top of the page.

## Overview

A button that floats at the top of the page.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- For global functionality on the site.
- Buttons that can be seen wherever you browse.
## Input Fields

### API

#### Required

- No required properties.

#### Optional

- `icon`: ReactNode, Set the icon component of button.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `content`: ReactNode, Text and other.
- `~~description~~`: ReactNode, Please use `content` instead.
- `tooltip`: ReactNode | [TooltipProps](/components/tooltip#api), The text shown in the tooltip. Version TooltipProps: 5.25.0.
- `type`: `default` | `primary`, Setting button type. Default `default`.
- `shape`: `circle` | `square`, Setting button shape of children. Default `circle`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `onClick`: () => void, A callback function, which can be executed when you click the button.
- `href`: string, The target of hyperlink.
- `target`: () => HTMLElement, Specifies the scrollable area dom node. Default () => window.
- `htmlType`: `submit` | `reset` | `button`, Set the original html `type` of `button`, see: [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type). Default `button`. Version 5.21.0.
- `badge`: [BadgeProps](/components/badge#api), Attach Badge to FloatButton. `status` and other props related are not supported. Version 5.4.0.

### FloatButton.Group Props

#### Required

- No required properties.

#### Optional

- `shape`: `circle` | `square`, Setting button shape of children. Default `circle`.
- `trigger`: `click` | `hover`, Which action can trigger menu open/close.
- `open`: boolean, Whether the menu is visible or not, use it with trigger.
- `closeIcon`: React.ReactNode, Customize close button icon. Default `<CloseOutlined />`.
- `placement`: `top` | `left` | `right` | `bottom`, Customize menu animation placement. Default `top`. Version 5.21.0.
- `onOpenChange`: (open: boolean) => void, Callback executed when active menu is changed, use it with trigger.
- `onClick`: (event) => void, Set the handler to handle `click` event (only work in `Menu mode`). Version 5.3.0.

### FloatButton.BackTop Props

#### Required

- No required properties.

#### Optional

- `duration`: number, Time to return to top(ms). Default 450.
- `target`: () => HTMLElement, Specifies the scrollable area dom node. Default () => window.
- `visibilityHeight`: number, The BackTop button will not show until the scroll height reaches this value. Default 400.
- `onClick`: () => void, A callback function, which can be executed when you click the button.

## Methods

No public methods.

## Usage Recommendations

Use FloatButton to a button that floats at the top of the page.

## Example Code

```tsx
import {
  CommentOutlined, CustomerServiceOutlined, QuestionCircleOutlined, } from '@ant-design/icons';
import { FloatButton } from 'antd';

const App: React.FC = () => (
  <>
    <FloatButton onClick={() => console.log('click')} />

    <FloatButton icon={<QuestionCircleOutlined />} type="primary" style={{ insetInlineEnd: 24 }} />

    <FloatButton shape="square" type="primary" description="HELP" style={{ insetInlineEnd: 84 }} />

    <FloatButton
      icon={<CustomerServiceOutlined />}
      tooltip={<div>Documents</div>}
      style={{ insetInlineEnd: 144 }}
    />

    <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
      <FloatButton icon={<QuestionCircleOutlined />} />
      <FloatButton icon={<CustomerServiceOutlined />} />
      <FloatButton.BackTop visibilityHeight={0} />
    </FloatButton.Group>

    <FloatButton.Group
      trigger="hover"
      type="primary"
      style={{ insetInlineEnd: 94 }}
      icon={<CustomerServiceOutlined />}
    >
      <FloatButton icon={<CommentOutlined />} />
      <FloatButton icon={<QuestionCircleOutlined />} />
    </FloatButton.Group>

    <FloatButton.BackTop />
  </>
);
```

## Result

Renders a FloatButton component.

## References
- Component docs: `https://ant.design/components/float-button` — use for API details, defaults, and official examples.