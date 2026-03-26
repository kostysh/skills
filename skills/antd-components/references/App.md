# App — Application wrapper for some global usages.

## Overview

Application wrapper for some global usages.

## When To Use

- Provide reset styles based on `.ant-app` element.
- You could use static methods of `message/notification/Modal` from `useApp` without writing `contextHolder` manually.
## Input Fields

### App Props

#### Required

- No required properties.

#### Optional

- `component`: ComponentType | false, Config render element, if `false` will not create DOM node. Default div. Version 5.11.0.
- `message`: [MessageConfig](/components/message/#messageconfig), Global config for Message. Version 5.3.0.
- `notification`: [NotificationConfig](/components/notification/#notificationconfig), Global config for Notification. Version 5.3.0.

## Methods

No public methods.

## Usage Recommendations

Use App to application wrapper for some global usages.

## Example Code

```tsx
import { App, Button, ConfigProvider, Space } from 'antd';

const MyPage: React.FC = () => {
  const { message, notification, modal } = App.useApp();

  const showMessage = () => {
    message.success('Success!');
  };

  const showNotification = () => {
    notification.info({
      message: 'Notification Title', description: 'This is the content of the notification.', });
  };

  const showModal = () => {
    modal.confirm({
      title: 'Confirm', content: 'Are you sure?', onOk: () => message.success('Confirmed!'), });
  };

  return (
    <Space>
      <Button type="primary" onClick={showMessage}>
        Message
      </Button>
      <Button onClick={showNotification}>Notification</Button>
      <Button onClick={showModal}>Modal</Button>
    </Space>
  );
};

const AppRoot: React.FC = () => (
  <App>
    <MyPage />
  </App>
);

export default AppRoot;

const AppWithConfig: React.FC = () => (
  <App message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
    <MyPage />
  </App>
);

const AppWithTheme: React.FC = () => (
  <ConfigProvider
    theme={{
      token: { colorPrimary: '#00b96b' }, }}
  >
    <App>
      <MyPage />
    </App>
  </ConfigProvider>
);
```

## Result

Renders an App component.

## References
- Component docs: `https://ant.design/components/app` — use for API details, defaults, and official examples.