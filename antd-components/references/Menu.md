# Menu — A versatile menu for navigation.

## Overview

A versatile menu for navigation.

## When To Use

- Navigation is an important part of any website, as a good navigation setup allows users to move around the site quickly and efficiently. Ant Design offers two navigation options: top and side. Top navigation provides all the categories and functions of the website. Side navigation provides the multi-level structure of the website.
- More layouts with navigation: [Layout](/components/layout).
## Input Fields

### Menu Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultOpenKeys`: string\[], Array with the keys of default opened sub menus.
- `defaultSelectedKeys`: string\[], Array with the keys of default selected menu items.
- `expandIcon`: ReactNode | `(props: SubMenuProps & { isSubMenu: boolean }) => ReactNode`, custom expand icon of submenu. Version 4.9.0.
- `forceSubMenuRender`: boolean, Render submenu into DOM before it becomes visible. Default false.
- `inlineCollapsed`: boolean, Specifies the collapsed status when menu is inline mode.
- `inlineIndent`: number, Indent (in pixels) of inline menu items on each level. Default 24.
- `items`: [ItemType\[\]](#itemtype), Menu item content. Version 4.20.0.
- `mode`: `vertical` | `horizontal` | `inline`, Type of menu. Default `vertical`.
- `multiple`: boolean, Allows selection of multiple items. Default false.
- `openKeys`: string\[], Array with the keys of currently opened sub-menus.
- `overflowedIndicator`: ReactNode, Customized the ellipsis icon when menu is collapsed horizontally. Default `<EllipsisOutlined />`.
- `selectable`: boolean, Allows selecting menu items. Default true.
- `selectedKeys`: string\[], Array with the keys of currently selected menu items.
- `style`: CSSProperties, Style of the root node.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `subMenuCloseDelay`: number, Delay time to hide submenu when mouse leaves (in seconds). Default 0.1.
- `subMenuOpenDelay`: number, Delay time to show submenu when mouse enters, (in seconds). Default 0.
- `theme`: `light` | `dark`, Color theme of the menu. Default `light`.
- `triggerSubMenuAction`: `hover` | `click`, Which action can trigger submenu open/close. Default `hover`.
- `onClick`: function({ key, keyPath, domEvent }), Called when a menu item is clicked.
- `onDeselect`: function({ key, keyPath, selectedKeys, domEvent }), Called when a menu item is deselected (multiple mode only).
- `onOpenChange`: function(openKeys: string\[]), Called when sub-menus are opened or closed.
- `onSelect`: function({ key, keyPath, selectedKeys, domEvent }), Called when a menu item is selected.
- `popupRender`: (node: ReactElement, props: { item: SubMenuProps; keys: string[] }) => ReactElement, Custom popup renderer for submenu.

### MenuItemType Props

#### Required

- No required properties.

#### Optional

- `danger`: boolean, false.
- `disabled`: boolean, false.
- `extra`: ReactNode, Version 5.21.0.
- `icon`: ReactNode, .
- `key`: string, item .
- `label`: ReactNode, .
- `title`: string, .

### SubMenuType Props

#### Required

- No required properties.

#### Optional

- `children`: [ItemType\[\]](#itemtype), .
- `disabled`: boolean, false.
- `icon`: ReactNode, .
- `key`: string, .
- `label`: ReactNode, .
- `popupClassName`: string, `mode="inline"` .
- `popupOffset`: \[number, number], `mode="inline"` .
- `onTitleClick`: function({ key, domEvent }), .
- `theme`: `light` | `dark`, Color theme of the menu. Default `light`.
- `popupRender`: (node: ReactElement, props: { item: SubMenuProps; keys: string[] }) => ReactElement, Custom popup renderer for submenu.

### group Props

#### Required

- No required properties.

#### Optional

- `children`: [MenuItemType\[\]](#menuitemtype), .
- `label`: ReactNode, .

### divider Props

#### Required

- No required properties.

#### Optional

- `dashed`: boolean, false.

## Methods

No public methods.

## Usage Recommendations

Use Menu to a versatile menu for navigation.

## Example Code

```tsx
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: 'sub1', label: 'Navigation One', icon: <MailOutlined />, children: [
      { key: '1', label: 'Option 1' }, { key: '2', label: 'Option 2' }, ], }, {
    key: 'sub2', label: 'Navigation Two', icon: <AppstoreOutlined />, children: [
      { key: '3', label: 'Option 3' }, { key: '4', label: 'Option 4' }, ], }, {
    key: 'sub4', label: 'Navigation Three', icon: <SettingOutlined />, children: [
      { key: '5', label: 'Option 5' }, { key: '6', label: 'Option 6' }, ], }, ];

const App: React.FC = () => (
  <Menu
    mode="inline"
    defaultSelectedKeys={['1']}
    defaultOpenKeys={['sub1']}
    style={{ width: 256 }}
    items={items}
  />
);
```

## Result

Renders a Menu component.

## References
- Component docs: `https://ant.design/components/menu` — use for API details, defaults, and official examples.