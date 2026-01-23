# Dropdown — A dropdown list.

## Overview

A dropdown list.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When there are more than a few options to choose from, you can wrap them in a `Dropdown`. By hovering or clicking on the trigger, a dropdown menu will appear, which allows you to choose an option and execute the relevant action.
## Input Fields

### Dropdown Props

#### Required

- No required properties.

#### Optional

- `arrow`: boolean | { pointAtCenter: boolean }, Whether the dropdown arrow should be visible. Default false.
- `autoAdjustOverflow`: boolean, Whether to adjust dropdown placement automatically when dropdown is off screen. Default true. Version 5.2.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Dropdown component. Supports object or function.
- `disabled`: boolean, Whether the dropdown menu is disabled.
- `~~destroyPopupOnHide~~`: boolean, Whether destroy dropdown when hidden, use `destroyOnHidden` instead. Default false.
- `destroyOnHidden`: boolean, Whether destroy dropdown when hidden. Default false. Version 5.25.0.
- `~~dropdownRender~~`: (menus: ReactNode) => ReactNode, Customize dropdown content, use `popupRender` instead. Version 4.24.0.
- `popupRender`: (menus: ReactNode) => ReactNode, Customize popup content. Version 5.25.0.
- `getPopupContainer`: (triggerNode: HTMLElement) => HTMLElement, To set the container of the dropdown menu. The default is to create a div element in body, but you can reset it to the scrolling area and make a relative reposition. [Example on CodePen](https://codepen.io/afc163/pen/zEjNOy?editors=0010). Default () => document.body.
- `menu`: [MenuProps](/components/menu/#api), The menu props.
- `~~overlayClassName~~`: string, The class name of the dropdown root element, please use `classNames.root` instead.
- `~~overlayStyle~~`: CSSProperties, The style of the dropdown root element, please use `styles.root` instead.
- `placement`: string, Placement of popup menu: `bottom` `bottomLeft` `bottomRight` `top` `topLeft` `topRight`. Default `bottomLeft`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Dropdown component. Supports object or function.
- `trigger`: Array&lt;`click`|`hover`|`contextMenu`>, The trigger mode which executes the dropdown action. Note that hover can't be used on touchscreens. Default \[`hover`].
- `open`: boolean, Whether the dropdown menu is currently open.
- `onOpenChange`: (open: boolean, info: { source: 'trigger' | 'menu' }) => void, Called when the open state is changed. Not trigger when hidden by click item. Version `info.source`: 5.11.0.

## Methods

No public methods.

## Usage Recommendations

Use Dropdown to a dropdown list.

## Example Code

```tsx
import { DownOutlined, SmileOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';

const items: MenuProps['items'] = [
  { key: '1', label: 'Action 1' }, { key: '2', label: 'Action 2' }, { type: 'divider' }, { key: '3', label: 'Action 3', disabled: true }, { key: '4', danger: true, label: 'Delete' }, ];

const App: React.FC = () => (
  <Space>
    <Dropdown menu={{ items }}>
      <a onClick={(e) => e.prevent. Default()}>
        <Space>
          Hover me
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>

    <Dropdown menu={{ items }} trigger={['click']}>
      <a onClick={(e) => e.prevent. Default()}>
        <Space>
          Click me
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>

    <Dropdown.Button menu={{ items }} onClick={() => console.log('click left button')}>
      Dropdown
    </Dropdown.Button>

    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      <div style={{ padding: 20, background: '#f5f5f5' }}>Right Click on here</div>
    </Dropdown>

    <Dropdown menu={{ items }} arrow>
      <Button>With Arrow</Button>
    </Dropdown>
  </Space>
);
```

## Result

Renders a Dropdown component.

## References
- Component docs: `https://ant.design/components/dropdown` — use for API details, defaults, and official examples.