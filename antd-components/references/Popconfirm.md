# Popconfirm — Pop up a bubble confirmation box for an action.

## Overview

Pop up a bubble confirmation box for an action.

## When To Use

- A simple and compact dialog used for asking for user confirmation.
- The difference with the `confirm` modal dialog is that it's more lightweight than the static popped full-screen confirm modal.
## Input Fields

### Popconfirm Props

#### Required

- No required properties.

#### Optional

- `cancelButtonProps`: [ButtonProps](/components/button/#api), The cancel button props.
- `cancelText`: string, The text of the Cancel button. Default `Cancel`.
- `disabled`: boolean, Whether show popconfirm when click its childrenNode. Default false.
- `icon`: ReactNode, Customize icon of confirmation. Default &lt;ExclamationCircle />.
- `okButtonProps`: [ButtonProps](/components/button/#api), The ok button props.
- `okText`: string, The text of the Confirm button. Default `OK`.
- `okType`: string, Button `type` of the Confirm button. Default `primary`.
- `showCancel`: boolean, Show cancel button. Default true. Version 4.18.0.
- `title`: ReactNode | () => ReactNode, The title of the confirmation box.
- `description`: ReactNode | () => ReactNode, The description of the confirmation box title. Version 5.1.0.
- `onCancel`: function(e), A callback of cancel.
- `onConfirm`: function(e), A callback of confirmation.
- `onPopupClick`: function(e), A callback of popup click. Version 5.5.0.

## Methods

No public methods.

## Usage Recommendations

Use Popconfirm to pop up a bubble confirmation box for an action.

## Example Code

```tsx
import { Button, message, Popconfirm } from 'antd';

const App: React.FC = () => {
  const confirm = () => {
    message.success('Confirmed');
  };

  const cancel = () => {
    message.error('Cancelled');
  };

  return (
    <Popconfirm
      title="Delete the task"
      description="Are you sure to delete this task?"
      onConfirm={confirm}
      onCancel={cancel}
      okText="Yes"
      cancelText="No"
    >
      <Button danger>Delete</Button>
    </Popconfirm>
  );
};
```

## Result

Renders a Popconfirm component.

## References
- Component docs: `https://ant.design/components/popconfirm` — use for API details, defaults, and official examples.