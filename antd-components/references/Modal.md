# Modal — Display a modal dialog box, providing a title, content area, and action buttons.

## Overview

Display a modal dialog box, providing a title, content area, and action buttons.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When requiring users to interact with the application, but without jumping to a new page and interrupting the user's workflow, you can use `Modal` to create a new floating layer over the current page to get user feedback or display information.
- Additionally, if you need to show a simple confirmation dialog, you can use [`App.useApp`](/components/app/) hooks.
## Input Fields

### Modal Props

#### Required

- No required properties.

#### Optional

- `afterClose`: function, Specify a function that will be called when modal is closed completely.
- `cancelButtonProps`: [ButtonProps](/components/button/#api), The cancel button props.
- `cancelText`: ReactNode, Text of the Cancel button. Default `Cancel`.
- `centered`: boolean, Centered Modal. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Modal component. Supports object or function.
- `closable`: boolean | [ClosableType](#closabletype), Whether a close (x) button is visible on top right or not. Default true.
- `closeIcon`: ReactNode, Custom close icon. 5.7.0: close button will be hidden when setting to `null` or `false`. Default &lt;CloseOutlined />.
- `confirmLoading`: boolean, Whether to apply loading visual effect for OK button or not. Default false.
- `~~destroyOnClose~~`: boolean, Whether to unmount child components on onClose. Default false Deprecated.
- `destroyOnHidden`: boolean, Whether to unmount child components on onClose. Default false. Version 5.25.0.
- `~~focusTriggerAfterClose~~`: boolean, Whether need to focus trigger element after dialog is closed. Please use `focusable.focusTriggerAfterClose` instead. Default true. Version 4.9.0.
- `footer`: ReactNode | (originNode: ReactNode, extra: { OkBtn: React.FC, CancelBtn: React.FC }) => ReactNode, Footer content, set as `footer={null}` when you don't need default buttons. Default (OK and Cancel buttons). Version renderFunction: 5.9.0.
- `forceRender`: boolean, Force render Modal. Default false.
- `focusable`: `{ trap?: boolean, focusTriggerAfterClose?: boolean }`, Configuration for focus management in the Modal. Version 6.2.0.
- `getContainer`: HTMLElement | () => HTMLElement | Selectors | false, The mounted node for Modal but still display at fullscreen. Default document.body.
- `keyboard`: boolean, Whether support press esc to close. Default true.
- `mask`: boolean | `{enabled: boolean, blur: boolean}`, Mask effect. Default true.
- `maskClosable`: boolean, Whether to close the modal dialog when the mask (area outside the modal) is clicked. Default true.
- `modalRender`: (node: ReactNode) => ReactNode, Custom modal content render. Version 4.7.0.
- `okButtonProps`: [ButtonProps](/components/button/#api), The ok button props.
- `okText`: ReactNode, Text of the OK button. Default `OK`.
- `okType`: string, Button `type` of the OK button. Default `primary`.
- `style`: CSSProperties, Style of floating layer, typically used at least for adjusting the position.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Modal component. Supports object or function.
- `loading`: boolean, Show the skeleton. Version 5.18.0.
- `title`: ReactNode, The modal dialog's title.
- `open`: boolean, Whether the modal dialog is visible or not. Default false.
- `width`: string | number | [Breakpoint](/components/grid-cn#col), Width of the modal dialog. Default 520. Version Breakpoint: 5.23.0.
- `wrapClassName`: string, The class name of the container of the modal dialog.
- `zIndex`: number, The `z-index` of the Modal. Default 1000.
- `onCancel`: function(e), Specify a function that will be called when a user clicks mask, close button on top right or Cancel button.
- `onOk`: function(e), Specify a function that will be called when a user clicks the OK button.
- `afterOpenChange`: (open: boolean) => void, Callback when the animation ends when Modal is turned on and off. Version 5.4.0.

### Modal.method()

#### Required

- No required properties.

#### Optional

- `afterClose`: function, Specify a function that will be called when modal is closed completely. Version 4.9.0.
- `~~autoFocusButton~~`: null | `ok` | `cancel`, Specify which button to autofocus. Please use `focusable.autoFocusButton` instead. Default `ok`.
- `cancelButtonProps`: [ButtonProps](/components/button/#api), The cancel button props.
- `cancelText`: string, Text of the Cancel button with Modal.confirm. Default `Cancel`.
- `centered`: boolean, Centered Modal. Default false.
- `className`: string, The className of container.
- `closable`: boolean | [ClosableType](#closabletype), Whether a close (x) button is visible on top right of the confirm dialog or not. Default false.
- `closeIcon`: ReactNode, Custom close icon. Default undefined. Version 4.9.0.
- `content`: ReactNode, Content.
- `focusable.autoFocusButton`: null | `ok` | `cancel`, Specify which button to autofocus. Default `ok`. Version 6.2.0.
- `footer`: ReactNode | (originNode: ReactNode, extra: { OkBtn: React.FC, CancelBtn: React.FC }) => ReactNode, Footer content, set as `footer: null` when you don't need default buttons. Version renderFunction: 5.9.0.
- `getContainer`: HTMLElement | () => HTMLElement | Selectors | false, Return the mount node for Modal. Default document.body.
- `icon`: ReactNode, Custom icon. Default &lt;ExclamationCircleFilled />.
- `keyboard`: boolean, Whether support press esc to close. Default true.
- `mask`: boolean | `{enabled: boolean, blur: boolean}`, Mask effect. Default true.
- `maskClosable`: boolean, Whether to close the modal dialog when the mask (area outside the modal) is clicked. Default false.
- `okButtonProps`: [ButtonProps](/components/button/#api), The ok button props.
- `okText`: string, Text of the OK button. Default `OK`.
- `okType`: string, Button `type` of the OK button. Default `primary`.
- `style`: CSSProperties, Style of floating layer, typically used at least for adjusting the position.
- `title`: ReactNode, Title.
- `width`: string | number, Width of the modal dialog. Default 416.
- `wrapClassName`: string, The class name of the container of the modal dialog. Version 4.18.0.
- `zIndex`: number, The `z-index` of the Modal. Default 1000.
- `onCancel`: function(close), Click to onCancel the callback, the parameter is the closing function, if it returns a promise, resolve means normal closing, reject means not closing.
- `onOk`: function(close), Click to onOk the callback, the parameter is the closing function, if it returns a promise, resolve means normal closing, reject means not closing.

### ClosableType Props

#### Required

- No required properties.

#### Optional

- `afterClose`: function, Specify a function that will be called when modal is closed completely.
- `closeIcon`: ReactNode, Custom close icon. Default undefined.
- `disabled`: boolean, Whether disabled close icon. Default false.
- `onClose`: Function, Trigger when modal close. Default undefined.

## Methods

- `Modal.method()` RTL  hooks .
- `Modal.info`
- `Modal.success`
- `Modal.error`
- `Modal.warning`
- `Modal.confirm`
- `Modal.destroyAll`

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { useState } from 'react';
import { Button, Modal } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Text
      </Button>
      <Modal
        title="Text"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <p>Text</p>
      </Modal>
    </>
  );
};
```

### Scenario 2: Asynchronously close

```tsx
import { useState } from 'react';
import { Button, Modal, Space } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Text');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        DeleteText
      </Button>
      <Modal
        title="TextDelete"
        open={open}
        confirmLoading={loading}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
      >
        <p>TextOKTextDeleteText？Text.</p>
      </Modal>
    </>
  );
};
```

### Scenario 3: Customized Footer

```tsx
import { useState } from 'react';
import { Button, Modal } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Text</Button>
      <Modal
        title="Text"
        open={open}
        footer={[
          <Button key="back" onClick={() => setOpen(false)}>
            Text
          </Button>, <Button key="save" type="primary" onClick={() => setOpen(false)}>
            Text
          </Button>, <Button key="submit" type="primary" onClick={() => setOpen(false)}>
            Submit
          </Button>, ]}
        onCancel={() => setOpen(false)}
      >
        <p>Text</p>
      </Modal>
    </>
  );
};
```

### Scenario 4: mask

```tsx
import { useState } from 'react';
import { Button, Divider, Modal } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>TextNotice</Button>
      <Modal
        title="Notice"
        open={open}
        footer={null} // Text
        closable={true} // TextCloseText
        onCancel={() => setOpen(false)}
      >
        <p>TextNotice, Text X Close.</p>
      </Modal>
    </>
  );
};
```

### Scenario 5: Use hooks to get context

```tsx
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';

const App: React.FC = () => (
  <>
    <Button
      onClick={() => {
        Modal.confirm({
          title: 'TextDelete', icon: <ExclamationCircleOutlined />, content: 'TextDeleteText？', okText: 'OK', cancelText: 'Cancel', onOk() {
            console.log('OK');
          }, onCancel() {
            console.log('Cancel');
          }, });
      }}
    >
      Text
    </Button>

    <Button
      onClick={() => {
        Modal.info({
          title: 'Text', content: 'TextNotice', });
      }}
    >
      Text
    </Button>

    <Button
      onClick={() => {
        Modal.success({
          title: 'Text', content: 'Text！', });
      }}
    >
      Text
    </Button>

    <Button
      onClick={() => {
        Modal.error({
          title: 'Text', content: 'Text, Text.', });
      }}
    >
      Text
    </Button>
  </>
);
```

### Scenario 6: Internationalization

```tsx
import { useState } from 'react';
import { Button, Modal, Space } from 'antd';

const DemoContent: React.FC = () => {
  const [modal, contextHolder] = Modal.useModal();

  const handleShowModal = () => {
    modal.confirm({
      title: 'Context Text', content: 'Text Modal.useModal() Text', onOk() {
        console.log('OK');
      }, });
  };

  return (
    <>
      <Button onClick={handleShowModal}>Text</Button>
      {contextHolder}
    </>
  );
};

const App: React.FC = () => <DemoContent />;
```

## Usage Recommendations

Use Modal to display a modal dialog box, providing a title, content area, and action buttons.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Modal } from 'antd';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    setConfirmLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setOpen(false);
    setConfirmLoading(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Modal
        title="Title"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={() => setOpen(false)}
      >
        <p>Modal content.</p>
      </Modal>
    </>
  );
};
```

## Result

Renders a Modal component.

## References
- Component docs: `https://ant.design/components/modal` — use for API details, defaults, and official examples.