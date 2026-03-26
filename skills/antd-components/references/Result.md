# Result — Used to feedback the processing results of a series of operations.

## Overview

Used to feedback the processing results of a series of operations.

## When To Use

- Use when important operations need to inform the user to process the results and the feedback is more complicated.
## Input Fields

### Result Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `extra`: ReactNode, Operating area.
- `icon`: ReactNode, Custom back icon.
- `status`: `success` | `error` | `info` | `warning` | `404` | `403` | `500`, Result status, decide icons and colors. Default `info`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `subTitle`: ReactNode, The subTitle.
- `title`: ReactNode, The title.

## Methods

No public methods.

## Usage Recommendations

Use Result to used to feedback the processing results of a series of operations.

## Example Code

```tsx
import { CloseCircleOutlined, SmileOutlined } from '@ant-design/icons';
import { Button, Result, Typography } from 'antd';

const { Paragraph, Text } = Typography;

const App: React.FC = () => (
  <>
    <Result
      status="success"
      title="Successfully Purchased Cloud Server ECS!"
      subTitle="Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes."
      extra={[
        <Button type="primary" key="console">
          Go Console
        </Button>, <Button key="buy">Buy Again</Button>, ]}
    />

    <Result
      status="error"
      title="Submission Failed"
      subTitle="Please check and modify the following information before resubmitting."
      extra={[
        <Button type="primary" key="console">
          Go Console
        </Button>, <Button key="buy">Buy Again</Button>, ]}
    >
      <div>
        <Paragraph>
          <Text strong style={{ fontSize: 16 }}>
            The content you submitted has the following error:
          </Text>
        </Paragraph>
        <Paragraph>
          <CloseCircleOutlined style={{ color: 'red' }} /> Your account has been frozen.
        </Paragraph>
        <Paragraph>
          <CloseCircleOutlined style={{ color: 'red' }} /> Your account is not yet eligible.
        </Paragraph>
      </div>
    </Result>

    <Result
      title="Your operation has been executed"
      extra={<Button type="primary">Go Console</Button>}
    />

    <Result
      status="warning"
      title="There are some problems with your operation."
      extra={<Button type="primary">Go Console</Button>}
    />

    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={<Button type="primary">Back Home</Button>}
    />

    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={<Button type="primary">Back Home</Button>}
    />

    <Result
      status="500"
      title="500"
      subTitle="Sorry, something went wrong."
      extra={<Button type="primary">Back Home</Button>}
    />

    <Result
      icon={<SmileOutlined />}
      title="Great, we have done all the operations!"
      extra={<Button type="primary">Next</Button>}
    />
  </>
);
```

## Result

Renders a Result component.

## References
- Component docs: `https://ant.design/components/result` — use for API details, defaults, and official examples.