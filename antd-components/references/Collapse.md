# Collapse — A content area which can be collapsed and expanded.

## Overview

A content area which can be collapsed and expanded.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Can be used to group or hide complex regions to keep the page clean.
- `Accordion` is a special kind of `Collapse`, which allows only one panel to be expanded at a time.
## Input Fields

### Collapse Props

#### Required

- No required properties.

#### Optional

- `accordion`: boolean, If true, Collapse renders as Accordion. Default false.
- `activeKey`: string\[] | string <br/> number\[] | number, Key of the active panel. Default No default value. In [accordion mode](#collapse-demo-accordion), it's the key of the first panel.
- `bordered`: boolean, Toggles rendering of the border around the collapse block. Default true.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `collapsible`: `header` | `icon` | `disabled`, Specify how to trigger Collapse. Either by clicking icon or by clicking any area in header or disable collapse functionality itself. Version 4.9.0.
- `defaultActiveKey`: string\[] | string <br/> number\[] | number, Key of the initial active panel.
- `~~destroyInactivePanel~~`: boolean, Destroy Inactive Panel. Default false Deprecated.
- `destroyOnHidden`: boolean, Destroy Inactive Panel. Default false. Version 5.25.0.
- `expandIcon`: (panelProps) => ReactNode, Allow to customize collapse icon.
- `expandIconPlacement`: `start` | `end`, Set expand icon placement. Default `start`.
- `~~expandIconPosition~~`: `start` | `end`, Set expand icon position, Please use `expandIconPlacement` instead. Version 4.21.0.
- `ghost`: boolean, Make the collapse borderless and its background transparent. Default false. Version 4.4.0.
- `size`: `large` | `middle` | `small`, Set the size of collapse. Default `middle`. Version 5.2.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `onChange`: function, Callback function executed when active panel is changed.
- `items`: [ItemType](#itemtype), collapse items content. Version 5.6.0.

### ItemType Props

#### Required

- No required properties.

#### Optional

- `classNames`: [`Record<header | body, string>`](#semantic-dom), Semantic structure className. Version 5.21.0.
- `collapsible`: `header` | `icon` | `disabled`, Specify whether the panel be collapsible or the trigger area of collapsible.
- `children`: ReactNode, Body area content.
- `extra`: ReactNode, The extra element in the corner.
- `forceRender`: boolean, Forced render of content on panel, instead of lazy rendering after clicking on header. Default false.
- `key`: string | number, Unique key identifying the panel from among its siblings.
- `label`: ReactNode, Title of the panel.
- `showArrow`: boolean, If false, panel will not show arrow icon. If false, collapsible can't be set as icon. Default true.
- `styles`: [`Record<header | body, CSSProperties>`](#semantic-dom), Semantic DOM style. Version 5.21.0.

### Collapse.Panel Props

#### Required

- No required properties.

#### Optional

- `collapsible`: `header` | `icon` | `disabled`, Specify whether the panel be collapsible or the trigger area of collapsible. Version 4.9.0 (icon: 4.24.0).
- `extra`: ReactNode, The extra element in the corner.
- `forceRender`: boolean, Forced render of content on panel, instead of lazy rendering after clicking on header. Default false.
- `header`: ReactNode, Title of the panel.
- `key`: string | number, Unique key identifying the panel from among its siblings.
- `showArrow`: boolean, If false, panel will not show arrow icon. If false, collapsible can't be set as icon. Default true.

## Methods

No public methods.

## Usage Recommendations

Use Collapse to a content area which can be collapsed and expanded.

## Example Code

```tsx
import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse, Space } from 'antd';
import type { CollapseProps } from 'antd';

const items: CollapseProps['items'] = [
  {
    key: '1', label: 'This is panel header 1', children: <p>A dog is a type of domesticated animal.</p>, }, {
    key: '2', label: 'This is panel header 2', children: <p>A dog is a type of domesticated animal.</p>, }, {
    key: '3', label: 'This is panel header 3', children: <p>A dog is a type of domesticated animal.</p>, }, ];

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Collapse items={items} defaultActiveKey={['1']} />

    <Collapse accordion items={items} />

    <Collapse bordered={false} items={items} />

    <Collapse ghost items={items} />

    <Collapse
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      items={items}
    />

    <Collapse
      items={[
        {
          key: '1', label: 'This is panel 1', children: (
            <Collapse
              items={[{ key: '1-1', label: 'Nested panel', children: <p>Nested content</p> }]}
            />
          ), }, ]}
    />
  </Space>
);
```

## Result

Renders a Collapse component.

## References
- Component docs: `https://ant.design/components/collapse` — use for API details, defaults, and official examples.