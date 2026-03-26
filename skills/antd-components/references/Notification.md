# Notification — Prompt notification message globally.

## Overview

Prompt notification message globally.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- A notification with complex content.
- A notification providing a feedback based on the user interaction. Or it may show some details about upcoming steps the user may have to follow.
- A notification that is pushed by the application.
## Input Fields

### Notification.config Props

#### Required

- `description`: ReactNode, The content of notification box (required).

#### Optional

- `actions`: ReactNode, Customized button group. Version 5.24.0.
- `~~btn~~`: ReactNode, Customized close button group, please use `actions` instead.
- `className`: string, Customized CSS class.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `closable`: boolean | [ClosableType](#closabletype), true.
- `closeIcon`: ReactNode, Custom close icon. Default true. Version 5.7.0: close button will be hidden when setting to null or false.
- `duration`: number | false, Time in seconds before Notification is closed. When set to `0` or `false`, it will never be closed automatically. Default 4.5.
- `showProgress`: boolean, Show progress bar for auto-closing notification. Version 5.18.0.
- `pauseOnHover`: boolean, keep the timer running or not on hover. Default true. Version 5.18.0.
- `icon`: ReactNode, Customized icon.
- `key`: string, The unique identifier of the Notification.
- `title`: ReactNode, The title of notification box. Version 6.0.0.
- `~~message~~`: ReactNode, The title of notification box (deprecated), please use `title` instead.
- `placement`: string, Position of Notification, can be one of `top` | `topLeft` | `topRight` | `bottom` | `bottomLeft` | `bottomRight`. Default `topRight`.
- `role`: `alert | status`, The semantics of notification content recognized by screen readers. The default value is `alert`. When set as the default value, the screen reader will promptly interrupt any ongoing content reading and prioritize the notification content for immediate attention. Default `alert`. Version 5.6.0.
- `style`: [CSSProperties](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/e434515761b36830c3e58a970abf5186f005adac/types/react/index.d.ts#L794), Customized inline style.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `onClick`: function, Specify a function that will be called when the notification is clicked.
- `onClose`: function, Trigger when notification closed.
- `props`: Object, An object that can contain `data-*`, `aria-*`, or `role` props, to be put on the notification `div`. This currently only allows `data-testid` instead of `data-*` in TypeScript. See https://github.com/microsoft/TypeScript/issues/28960.

### notification.useNotification Props

#### Required

- No required properties.

#### Optional

- `bottom`: number, Distance from the bottom of the viewport, when `placement` is `bottom` `bottomRight` or `bottomLeft` (unit: pixels). Default 24.
- `closeIcon`: ReactNode, Custom close icon. Default true. Version 5.7.0: close button will be hidden when setting to null or false.
- `getContainer`: () => HTMLNode, Return the mount node for Notification. Default () => document.body.
- `placement`: string, Position of Notification, can be one of `top` | `topLeft` | `topRight` | `bottom` | `bottomLeft` | `bottomRight`. Default `topRight`.
- `showProgress`: boolean, Show progress bar for auto-closing notification. Version 5.18.0.
- `pauseOnHover`: boolean, keep the timer running or not on hover. Default true. Version 5.18.0.
- `rtl`: boolean, Whether to enable RTL mode. Default false.
- `stack`: boolean | `{ threshold: number }`, Notifications will be stacked when amount is over threshold. Default `{ threshold: 3 }`. Version 5.10.0.
- `top`: number, Distance from the top of the viewport, when `placement` is `top` `topRight` or `topLeft` (unit: pixels). Default 24.
- `maxCount`: number, Max Notification show, drop oldest if exceed limit. Version 4.17.0.

### ClosableType Props

#### Required

- No required properties.

#### Optional

- `closeIcon`: ReactNode, Custom close icon. Default undefined.
- `onClose`: Function, Trigger when notification close. Default undefined.

### notification.config Props

#### Required

- No required properties.

#### Optional

- `bottom`: number, Distance from the bottom of the viewport, when `placement` is `bottom` `bottomRight` or `bottomLeft` (unit: pixels). Default 24.
- `closeIcon`: ReactNode, Custom close icon. Default undefined.
- `duration`: number | false, Time in seconds before Notification is closed. When set to `0` or `false`, it will never be closed automatically. Default 4.5.
- `showProgress`: boolean, Show progress bar for auto-closing notification. Version 5.18.0.
- `pauseOnHover`: boolean, keep the timer running or not on hover. Default true. Version 5.18.0.
- `getContainer`: () => HTMLNode, Return the mount node for Notification. Default () => document.body.
- `placement`: string, Position of Notification, can be one of `top` | `topLeft` | `topRight` | `bottom` | `bottomLeft` | `bottomRight`. Default `topRight`.
- `rtl`: boolean, Whether to enable RTL mode. Default false.
- `top`: number, Distance from the top of the viewport, when `placement` is `top` `topRight` or `topLeft` (unit: pixels). Default 24.
- `maxCount`: number, Max Notification show, drop oldest if exceed limit. Version 4.17.0.

## Methods

- `notification.success(config)`
- `notification.error(config)`
- `notification.info(config)`
- `notification.warning(config)`
- `notification.open(config)`
- `notification.destroy(key?: String)`
- `notification.useNotification(config)`

## Usage Recommendations

Use Notification to prompt notification message globally.

## Example Code

```tsx
import { Button, notification, Space } from 'antd';

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();

  const openNotification = (type: 'success' | 'info' | 'warning' | 'error') => {
    api[type]({
      message: 'Notification Title', description: 'This is the content of the notification.', });
  };

  const openWithBtn = () => {
    api.open({
      message: 'Notification Title', description: 'This is the content of the notification.', btn: (
        <Button type="primary" size="small" onClick={() => api.destroy()}>
          Confirm
        </Button>
      ), });
  };

  return (
    <>
      {contextHolder}
      <Space>
        <Button onClick={() => openNotification('success')}>Success</Button>
        <Button onClick={() => openNotification('error')}>Error</Button>
        <Button onClick={openWithBtn}>With Button</Button>
      </Space>
    </>
  );
};
```

## Result

Renders a Notification component.

## References
- Component docs: `https://ant.design/components/notification` — use for API details, defaults, and official examples.