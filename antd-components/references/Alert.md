# Alert — Display warning messages that require attention.

## Overview

Display warning messages that require attention.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When you need to show alert messages to users.
- When you need a persistent static container which is closable by user actions.
## Input Fields

### Alert Props

#### Required

- No required properties.

#### Optional

- `action`: ReactNode, The action of Alert. Version 4.9.0.
- `~~afterClose~~`: () => void, Called when close animation is finished, please use `closable.afterClose` instead.
- `banner`: boolean, Whether to show as banner. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `closable`: boolean | [ClosableType](#closabletype) & React.AriaAttributes, The config of closable, >=5.15.0: support `aria-*`. Default `false`.
- `description`: ReactNode, Additional content of Alert.
- `icon`: ReactNode, Custom icon, effective when `showIcon` is true.
- `~~message~~`: ReactNode, Content of Alert, please use `title` instead.
- `title`: ReactNode, Content of Alert.
- `showIcon`: boolean, Whether to show icon. Default false, in `banner` mode default is true.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `type`: string, Type of Alert styles, options: `success`, `info`, `warning`, `error`. Default `info`, in `banner` mode default is `warning`.
- `~~onClose~~`: (e: MouseEvent) => void, Callback when Alert is closed, please use `closable.onClose` instead.

### ClosableType Props

#### Required

- No required properties.

#### Optional

- `afterClose`: function, Called when close animation is finished.
- `closeIcon`: ReactNode, Custom close icon.
- `onClose`: (e: MouseEvent) => void, Callback when Alert is closed.

### Alert.ErrorBoundary Props

#### Required

- No required properties.

#### Optional

- `description`: ReactNode, Custom error description to show. Default {{ error stack }}.
- `~~message~~`: ReactNode, Custom error message to show, please use `title` instead. Default {{ error }}.
- `title`: ReactNode, Custom error title to show. Default {{ error }}.

## Methods

No public methods.

## Usage Recommendations

Use Alert to display warning messages that require attention.

## Example Code

```tsx
import { Alert, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Alert message="Success Tips" type="success" showIcon />
    <Alert message="Informational Notes" type="info" showIcon />
    <Alert message="Warning" type="warning" showIcon closable />
    <Alert message="Error" type="error" showIcon />
    <Alert
      message="Success Tips"
      description="Detailed description and advice about successful copywriting."
      type="success"
      showIcon
    />
  </Space>
);
```

## Result

Renders an Alert component.

## References
- Component docs: `https://ant.design/components/alert` — use for API details, defaults, and official examples.