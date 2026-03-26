# Spin — Used for the loading status of a page or a block.

## Overview

Used for the loading status of a page or a block.

## When To Use

- When part of the page is waiting for asynchronous data or during a rendering process, an appropriate loading animation can effectively alleviate users' inquietude.
## Input Fields

### Spin Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `delay`: number (milliseconds), Specifies a delay in milliseconds for loading state (prevent flush).
- `fullscreen`: boolean, Display a backdrop with the `Spin` component. Default false. Version 5.11.0.
- `indicator`: ReactNode, React node of the spinning indicator.
- `percent`: number | 'auto', The progress percentage, when set to `auto`, it will be an indeterminate progress. Version 5.18.0.
- `size`: string, The size of Spin, options: `small`, `default` and `large`. Default `default`.
- `spinning`: boolean, Whether Spin is visible. Default true.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `tip`: ReactNode, Customize description content when Spin has children.
- `wrapperClassName`: string, The className of wrapper when Spin has children.

## Methods

- `Spin.set. DefaultIndicator(indicator: ReactNode)`

## Usage Recommendations

Use Spin to used for the loading status of a page or a block.

## Example Code

```tsx
import { LoadingOutlined } from '@ant-design/icons';
import { Alert, Space, Spin } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Space>
      <Spin size="small" />
      <Spin />
      <Spin size="large" />
    </Space>

    <Spin tip="Loading.">
      <Alert
        message="Alert message title"
        description="Further details about the context of this alert."
        type="info"
      />
    </Spin>

    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />

    <Spin spinning={true} delay={500}>
      <div style={{ padding: 50 }}>Content</div>
    </Spin>
  </Space>
);
```

## Result

Renders a Spin component.

## References
- Component docs: `https://ant.design/components/spin` — use for API details, defaults, and official examples.