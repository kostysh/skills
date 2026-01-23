# Breadcrumb — Display the current location within a hierarchy. And allow going back to states higher up in the hierarchy.

## Overview

Display the current location within a hierarchy. And allow going back to states higher up in the hierarchy.

## When To Use

- When the system has more than two layers in a hierarchy.
- When you need to inform the user of where they are.
- When the user may need to navigate back to a higher level.
## Input Fields

### Breadcrumb Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dropdownIcon`: ReactNode, Custom dropdown icon. Default `<DownOutlined />`. Version 6.2.0.
- `itemRender`: (route, params, routes, paths) => ReactNode, Custom item renderer.
- `params`: object, Routing parameters.
- `items`: [ItemType\[\]](#itemtype), The routing stack information of router. Version 5.3.0.
- `separator`: ReactNode, Custom separator. Default `/`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.

### RouteItemType Props

#### Required

- No required properties.

#### Optional

- `className`: string, The additional css class.
- `dropdownProps`: [Dropdown](/components/dropdown), The dropdown props.
- `href`: string, Target of hyperlink. Can not work with `path`.
- `path`: string, Connected path. Each path will connect with prev one. Can not work with `href`.
- `menu`: [MenuProps](/components/menu/#api), The menu props. Version 4.24.0.
- `onClick`: (e:MouseEvent) => void, Set the handler to handle click event.
- `title`: ReactNode, item name.

### SeparatorType Props

#### Required

- No required properties.

#### Optional

- `type`: `separator`, Mark as separator. Version 5.3.0.
- `separator`: ReactNode, Custom separator. Default `/`. Version 5.3.0.

## Methods

No public methods.

## Usage Recommendations

Use Breadcrumb to display the current location within a hierarchy. And allow going back to states higher up in the hierarchy.

## Example Code

```tsx
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

const App: React.FC = () => (
  <>
    <Breadcrumb
      items={[
        { title: 'Home' }, { title: 'Application Center', href: '' }, { title: 'Application List', href: '' }, { title: 'An Application' }, ]}
    />

    <Breadcrumb
      items={[
        { href: '', title: <HomeOutlined /> }, {
          href: '', title: (
            <>
              <UserOutlined />
              <span>Application List</span>
            </>
          ), }, { title: 'Application' }, ]}
    />

    <Breadcrumb
      items={[
        { title: 'Ant Design' }, {
          title: 'Component', menu: {
            items: [
              { key: '1', label: <a href="">General</a> }, { key: '2', label: <a href="">Layout</a> }, { key: '3', label: <a href="">Navigation</a> }, ], }, }, { title: 'Button' }, ]}
    />

    <Breadcrumb
      separator=">"
      items={[{ title: 'Home' }, { title: 'Application Center' }, { title: 'Application List' }]}
    />

    <Breadcrumb
      itemRender={(route, params, routes, paths) => {
        const last = routes.indexOf(route) === routes.length - 1;
        return last ? <span>{route.title}</span> : <Link to={route.path!}>{route.title}</Link>;
      }}
      items={[
        { path: '/', title: 'Home' }, { path: '/apps', title: 'Application List' }, { title: 'An Application' }, ]}
    />
  </>
);
```

## Result

Renders a Breadcrumb component.

## References
- Component docs: `https://ant.design/components/breadcrumb` — use for API details, defaults, and official examples.