# Tabs — Tabs make it easy to explore and switch between different views.

## Overview

Tabs make it easy to explore and switch between different views.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Card Tabs: for managing too many closeable views.
- Normal Tabs: for functional aspects of a page.
- [Radio.Button](/components/radio/#radio-demo-radiobutton): for secondary tabs.
## Input Fields

### Tabs Props

#### Required

- No required properties.

#### Optional

- `activeKey`: string, Current TabPane's key.
- `addIcon`: ReactNode, Customize add icon, only works with `type="editable-card"`. Default `<PlusOutlined />`. Version 4.4.0.
- `animated`: boolean | { inkBar: boolean, tabPane: boolean }, Whether to change tabs with animation. Default { inkBar: true, tabPane: false }.
- `centered`: boolean, Centers tabs. Default false. Version 4.4.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>(#semantic-dom), Customize class for each semantic structure inside the component. Supports object or function.
- `defaultActiveKey`: string, Initial active TabPane's key, if `activeKey` is not set. Default `The key of first tab`.
- `hideAdd`: boolean, Hide plus icon or not. Only works while `type="editable-card"`. Default false.
- `indicator`: { size?: number | (origin: number) => number; align: `start` | `center` | `end`; }, Customize `size` and `align` of indicator. Version 5.13.0.
- `items`: [TabItemType](#tabitemtype), Configure tab content. Default []. Version 4.23.0.
- `more`: [MoreProps](#moreprops), Customize the collapse menu. Default { icon: `<EllipsisOutlined />` , trigger: 'hover' }.
- `removeIcon`: ReactNode, The custom icon of remove, only works with `type="editable-card"`. Default `<CloseOutlined />`. Version 5.15.0.
- `~~popupClassName~~`: string, `className` for more dropdown, please use `classNames.popup` instead. Version 4.21.0.
- `renderTabBar`: (props: DefaultTabBarProps, DefaultTabBar: React.ComponentClass) => React.ReactElement, Replace the TabBar.
- `size`: `large` | `middle` | `small`, Preset tab bar size. Default `middle`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `tabBarExtraContent`: ReactNode | {left?: ReactNode, right?: ReactNode}, Extra content in tab bar. Version object: 4.6.0.
- `tabBarGutter`: number, The gap between tabs.
- `tabBarStyle`: CSSProperties, Tab bar style object.
- `tabPlacement`: `top` | `end` | `bottom` | `start`, Placement of tabs. Default `top`.
- `~~tabPosition~~`: `top` | `right` | `bottom` | `left`, please use `tabPlacement` instead, Position of tabs. Default `top`.
- `~~destroyInactiveTabPane~~`: boolean, Whether destroy inactive TabPane when change tab, use `destroyOnHidden` instead. Default false.
- `destroyOnHidden`: boolean, Whether destroy inactive TabPane when change tab. Default false. Version 5.25.0.
- `type`: `line` | `card` | `editable-card`, Basic style of tabs. Default `line`.
- `onChange`: (activeKey: string) => void, Callback executed when active tab is changed.
- `onEdit`: (action === 'add' ? event : targetKey, action) => void, Callback executed when tab is added or removed. Only works while `type="editable-card"`.
- `onTabClick`: (key: string, event: MouseEvent) => void, Callback executed when tab is clicked.
- `onTabScroll`: ({ direction: `left` | `right` | `top` | `bottom` }) => void, Trigger when tab scroll. Version 4.3.0.

### TabItemType Props

#### Required

- No required properties.

#### Optional

- `closeIcon`: ReactNode, Customize close icon in TabPane's head. Only works while `type="editable-card"`. 5.7.0: close button will be hidden when setting to `null` or `false`.
- `~~destroyInactiveTabPane~~`: boolean, Whether destroy inactive TabPane when change tab, use `destroyOnHidden` instead. Default false. Version 5.11.0.
- `destroyOnHidden`: boolean, Whether destroy inactive TabPane when change tab. Default false. Version 5.25.0.
- `disabled`: boolean, Set TabPane disabled. Default false.
- `forceRender`: boolean, Forced render of content in tabs, not lazy render after clicking on tabs. Default false.
- `key`: string, TabPane's key.
- `label`: ReactNode, Tab header text element.
- `icon`: ReactNode, Tab header icon element. Version 5.12.0.
- `children`: ReactNode, Tab content element.
- `closable`: boolean, Whether a close (x) button is visible, Only works while `type="editable-card"`. Default true.

### MoreProps Props

#### Required

- No required properties.

#### Optional

- `icon`: ReactNode, The custom icon.
- `[DropdownProps](/components/dropdown-cn#api)`.

## Methods

No public methods.

## Usage Recommendations

Use Tabs to tabs make it easy to explore and switch between different views.

## Example Code

```tsx
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

const items: TabsProps['items'] = [
  {
    key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1', }, {
    key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2', }, {
    key: '3', label: 'Tab 3', children: 'Content of Tab Pane 3', }, ];

const App: React.FC = () => (
  <Tabs defaultActiveKey="1" items={items} onChange={(key) => console.log(key)} />
);
```

## Result

Renders a Tabs component.

## References
- Component docs: `https://ant.design/components/tabs` — use for API details, defaults, and official examples.