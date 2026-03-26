# Message — Display global messages as feedback in response to user operations.

## Overview

Display global messages as feedback in response to user operations.

## When To Use

- To provide feedback such as success, warning, error etc.
- A message is displayed at top and center and will be dismissed automatically, as a non-interrupting light-weighted prompt.
## Input Fields

### Message Props

#### Required

- No required properties.

#### Optional

- `content`: ReactNode, The content of the message.
- `duration`: number, Time(seconds) before auto-dismiss, don't dismiss if set to 0. Default 3.
- `onClose`: function, Specify a function that will be called when the message is closed.

### Message.config Props

#### Required

- No required properties.

#### Optional

- `className`: string, Customized CSS class.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `content`: ReactNode, The content of the message.
- `duration`: number, Time(seconds) before auto-dismiss, don't dismiss if set to 0. Default 3.
- `icon`: ReactNode, Customized Icon.
- `pauseOnHover`: boolean, keep the timer running or not on hover. Default true.
- `key`: string | number, The unique identifier of the Message.
- `style`: [CSSProperties](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/e434515761b36830c3e58a970abf5186f005adac/types/react/index.d.ts#L794), Customized inline style.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `onClick`: function, Specify a function that will be called when the message is clicked.

### message.config Props

#### Required

- No required properties.

#### Optional

- `duration`: number, Time(seconds) before auto-dismiss, don't dismiss if set to 0. Default 3.
- `getContainer`: () => HTMLElement,   () => document.body.
- `maxCount`: number,   .
- `prefixCls`: string, className, `ant-message`, Version 4.5.0.
- `rtl`: boolean, RTL, false.
- `top`: string | number, 8.

## Methods

- `message.success(content, [duration], onClose)`
- `message.error(content, [duration], onClose)`
- `message.info(content, [duration], onClose)`
- `message.warning(content, [duration], onClose)`
- `message.loading(content, [duration], onClose)`
- `message[level](content, [duration]).then(afterClose)`
- `message[level](content, [duration], onClose).then(afterClose)`
- `message.open(config)`
- `message.success(config)`
- `message.error(config)`
- `message.info(config)`
- `message.warning(config)`
- `message.loading(config)`
- `message.config(options)`
- `message.destroy()`

## Usage Recommendations

Use Message to display global messages as feedback in response to user operations.

## Example Code

```tsx
import { Button, message, Space } from 'antd';

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: 'success', content: 'This is a success message', });
  };

  const error = () => {
    messageApi.open({
      type: 'error', content: 'This is an error message', });
  };

  const loading = () => {
    messageApi.open({
      type: 'loading', content: 'Action in progress.', duration: 0, });
    setTimeout(messageApi.destroy, 2500);
  };

  return (
    <>
      {contextHolder}
      <Space>
        <Button onClick={success}>Success</Button>
        <Button onClick={error}>Error</Button>
        <Button onClick={loading}>Loading</Button>
      </Space>
    </>
  );
};
```

## Result

Renders a Message component.

## References
- Component docs: `https://ant.design/components/message` — use for API details, defaults, and official examples.