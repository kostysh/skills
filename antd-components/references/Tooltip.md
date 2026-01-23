# Tooltip — Simple text popup box.

## Overview

Simple text popup box.

## When To Use

- The tip is shown on mouse enter, and is hidden on mouse leave. The Tooltip doesn't support complex text or operations.
- To provide an explanation of a `button/text/operation`. It's often used instead of the html `title` attribute.
## Input Fields

### Tooltip Props

#### Required

- No required properties.

#### Optional

- `title`: ReactNode | () => ReactNode, The text shown in the tooltip.
- `color`: string, The background color. After using this attribute, the internal text color will adapt automatically. Version 5.27.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Semantic DOM class.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Semantic DOM style.

## Methods

No public methods.

## Usage Recommendations

Use Tooltip to simple text popup box.

## Example Code

```tsx
import { Button, Divider, Space, Tooltip } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical">
    <Tooltip title="prompt text">
      <span>Tooltip will show on mouse enter.</span>
    </Tooltip>

    <div style={{ margin: 100 }}>
      <div style={{ marginBottom: 10, textAlign: 'center' }}>
        <Tooltip placement="topLeft" title="Prompt Text">
          <Button>TL</Button>
        </Tooltip>
        <Tooltip placement="top" title="Prompt Text">
          <Button>Top</Button>
        </Tooltip>
        <Tooltip placement="topRight" title="Prompt Text">
          <Button>TR</Button>
        </Tooltip>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Tooltip placement="bottomLeft" title="Prompt Text">
          <Button>BL</Button>
        </Tooltip>
        <Tooltip placement="bottom" title="Prompt Text">
          <Button>Bottom</Button>
        </Tooltip>
        <Tooltip placement="bottomRight" title="Prompt Text">
          <Button>BR</Button>
        </Tooltip>
      </div>
    </div>

    <Space>
      <Tooltip title="prompt text" color="cyan">
        <Button>Cyan</Button>
      </Tooltip>
      <Tooltip title="prompt text" color="purple">
        <Button>Purple</Button>
      </Tooltip>
      <Tooltip title="prompt text" color="#108ee9">
        <Button>Custom</Button>
      </Tooltip>
    </Space>

    <Tooltip title="Disabled Button">
      <span>
        <Button disabled style={{ pointerEvents: 'none' }}>
          Disabled
        </Button>
      </span>
    </Tooltip>
  </Space>
);
```

## Result

Renders a Tooltip component.

## References
- Component docs: `https://ant.design/components/tooltip` — use for API details, defaults, and official examples.