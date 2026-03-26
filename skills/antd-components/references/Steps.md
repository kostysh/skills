# Steps — A navigation bar that guides users through the steps of a task.

## Overview

A navigation bar that guides users through the steps of a task.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When a given task is complicated or has a certain sequence in the series of subtasks, we can decompose it into several steps to make things easier.
## Input Fields

### Steps Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `current`: number, To set the current step, counting from 0. You can overwrite this state by using `status` of `Step`. Default 0.
- `~~direction~~`: string, To specify the direction of the step bar, `horizontal` or `vertical`. Default `horizontal` Deprecated.
- `iconRender`: (oriNode, info: { index, active, item }) => ReactNode, Custom render icon, please use `items.icon` first.
- `initial`: number, Set the initial step, counting from 0. Default 0.
- `~~labelPlacement~~`: string, Place title and content with `horizontal` or `vertical` direction. Default `horizontal` Deprecated.
- `orientation`: string, To specify the orientation of the step bar, `horizontal` or `vertical`. Default `horizontal`.
- `percent`: number, Progress circle percentage of current step in `process` status (only works on basic Steps). Version 4.5.0.
- `progressDot`: boolean | (iconDot, { index, status, title, content }) => ReactNode, Steps with progress dot style, customize the progress dot by setting it to a function. `titlePlacement` will be `vertical`. Default false.
- `responsive`: boolean, Change to vertical direction when screen width smaller than `532px`. Default true.
- `size`: string, To specify the size of the step bar, `default` and `small` are currently supported. Default `default`.
- `status`: string, To specify the status of current step, can be set to one of the following values: `wait` `process` `finish` `error`. Default `process`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `titlePlacement`: string, Place title and content with `horizontal` or `vertical` direction. Default `horizontal`.
- `type`: string, Type of steps, can be set to one of the following values: `default` `dot` `inline` `navigation` `panel`. Default `default`.
- `variant`: `filled` | `outlined`, Config style variant. Default `filled`.
- `onChange`: (current) => void, Trigger when Step is changed.
- `items`: [StepItem](#stepitem), StepItem content. Default []. Version 4.24.0.

### StepItem Props

#### Required

- No required properties.

#### Optional

- `content`: ReactNode, Description of the step, optional property.
- `~~description~~`: ReactNode, Description of the step, optional property Deprecated.
- `disabled`: boolean, Disable click. Default false.
- `icon`: ReactNode, Icon of the step, optional property.
- `status`: string, To specify the status. It will be automatically set by `current` of `Steps` if not configured. Optional values are: `wait` `process` `finish` `error`. Default `wait`.
- `subTitle`: ReactNode, Subtitle of the step.
- `title`: ReactNode, Title of the step.

## Methods

No public methods.

## Usage Recommendations

Use Steps to a navigation bar that guides users through the steps of a task.

## Example Code

```tsx
import { useState } from 'react';
import { Button, message, Space, Steps } from 'antd';

const steps = [
  { title: 'First', description: 'This is description.' }, { title: 'Second', description: 'This is description.' }, { title: 'Last', description: 'This is description.' }, ];

const App: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Steps current={1} items={steps} />

      <Steps size="small" current={1} items={steps} />

      <Steps
        items={[
          { title: 'Login', status: 'finish', icon: <UserOutlined /> }, { title: 'Verification', status: 'process', icon: <SolutionOutlined /> }, { title: 'Pay', status: 'wait', icon: <LoadingOutlined /> }, { title: 'Done', status: 'wait', icon: <SmileOutlined /> }, ]}
      />

      <Steps current={current} onChange={setCurrent} items={steps} />

      <Steps direction="vertical" current={1} items={steps} />

      <Steps progressDot current={1} items={steps} />

      <Steps status="error" current={1} items={steps} />

      <Steps type="navigation" current={current} onChange={setCurrent} items={steps} />
    </Space>
  );
};
```

## Result

Renders a Steps component.

## References
- Component docs: `https://ant.design/components/steps` — use for API details, defaults, and official examples.