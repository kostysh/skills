# Splitter — Split panels to isolate

## Overview

Split panels to isolate

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Can be used to separate areas horizontally or vertically. When you need to freely drag and adjust the size of each area. When you need to specify the maximum and minimum width and height of an area.
## Input Fields

### Splitter Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `collapsibleIcon`: `{start: ReactNode; end: ReactNode}`, custom collapsible icon. Version 6.0.0.
- `draggerIcon`: `ReactNode`, custom dragger icon. Version 6.0.0.
- `~~layout~~`: `horizontal` | `vertical`, Layout direction. Default `horizontal` Deprecated.
- `lazy`: `boolean`, Lazy mode. Default `false`. Version 5.23.0.
- `onCollapse`: `(collapsed: boolean[], sizes: number[]) => void`, Callback when expanding or collapsing. Version 5.28.0.
- `orientation`: `horizontal` | `vertical`, Orientation direction. Default `horizontal`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `vertical`: boolean, Orientation，Simultaneously existing with `orientation`, `orientation` takes priority. Default `false`.
- `onResize`: `(sizes: number[]) => void`, Panel size change callback.
- `onResizeEnd`: `(sizes: number[]) => void`, Drag end callback.
- `onResizeStart`: `(sizes: number[]) => void`, Callback before dragging starts.

### Panel Props

#### Required

- No required properties.

#### Optional

- `collapsible`: `boolean | { start?: boolean; end?: boolean; showCollapsibleIcon?: boolean | 'auto' }`, Quick folding. Default `false`. Version showCollapsibleIcon: 5.27.0.
- `defaultSize`: `number | string`, Initial panel size support number for px or 'percent%' usage.
- `max`: `number | string`, Maximum threshold support number for px or 'percent%' usage.
- `min`: `number | string`, Minimum threshold support number for px or 'percent%' usage.
- `resizable`: `boolean`, Whether to enable drag and drop. Default `true`.
- `size`: `number | string`, Controlled panel size support number for px or 'percent%' usage.

## Methods

No public methods.

## Usage Recommendations

Use Splitter to split panels to isolate

## Example Code

```tsx
import { Flex, Splitter, Typography } from 'antd';

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => (
  <Flex justify="center" align="center" style={{ height: '100%' }}>
    <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
      {props.text}
    </Typography.Title>
  </Flex>
);

const App: React.FC = () => (
  <>
    <Splitter style={{ height: 300, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
      <Splitter.Panel>
        <Desc text="First" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
    </Splitter>

    <Splitter layout="vertical" style={{ height: 300 }}>
      <Splitter.Panel>
        <Desc text="First" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }}>
      <Splitter.Panel>
        <Desc text="First" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Third" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }}>
      <Splitter.Panel min={100} max={500}>
        <Desc text="First (min: 100, max: 500)" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }}>
      <Splitter.Panel collapsible>
        <Desc text="Collapsible" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }}>
      <Splitter.Panel collapsible={{ start: true, end: true }}>
        <Desc text="Both collapsible" />
      </Splitter.Panel>
      <Splitter.Panel collapsible={{ start: true, end: true }}>
        <Desc text="Both collapsible" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }}>
      <Splitter.Panel>
        <Splitter layout="vertical">
          <Splitter.Panel>
            <Desc text="Top" />
          </Splitter.Panel>
          <Splitter.Panel>
            <Desc text="Bottom" />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Right" />
      </Splitter.Panel>
    </Splitter>

    <Splitter style={{ height: 300 }} onResize={(sizes) => console.log('Resize:', sizes)}>
      <Splitter.Panel defaultSize="40%">
        <Desc text="40%" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="60%" />
      </Splitter.Panel>
    </Splitter>
  </>
);
```

## Result

Renders a Splitter component.

## References
- Component docs: `https://ant.design/components/splitter` — use for API details, defaults, and official examples.