# Layout — Handling the overall layout of a page.

## Overview

Handling the overall layout of a page.

## When To Use

- Use Layout to handling the overall layout of a page.
## Input Fields

### Layout Props

#### Required

- No required properties.

#### Optional

- `className`: string, Container className.
- `hasSider`: boolean, Whether contain Sider in children, don't have to assign it normally. Useful in ssr avoid style flickering.
- `style`: CSSProperties, To customize the styles.

### Layout.Sider Props

#### Required

- No required properties.

#### Optional

- `breakpoint`: `xs` | `sm` | `md` | `lg` | `xl` | `xxl`, [Breakpoints](/components/grid/#col) of the responsive layout.
- `className`: string, Container className.
- `collapsed`: boolean, To set the current status.
- `collapsedWidth`: number, Width of the collapsed sidebar, by setting to 0 a special trigger will appear. Default 80.
- `collapsible`: boolean, Whether can be collapsed. Default false.
- `defaultCollapsed`: boolean, To set the initial status. Default false.
- `reverseArrow`: boolean, Reverse direction of arrow, for a sider that expands from the right. Default false.
- `style`: CSSProperties, To customize the styles.
- `theme`: `light` | `dark`, Color theme of the sidebar. Default `dark`.
- `trigger`: ReactNode, Specify the customized trigger, set to null to hide the trigger.
- `width`: number | string, Width of the sidebar. Default 200.
- `zeroWidthTriggerStyle`: object, To customize the styles of the special trigger that appears when `collapsedWidth` is 0.
- `onBreakpoint`: (broken) => {}, The callback function, executed when [breakpoints](/components/grid/#api) changed.
- `onCollapse`: (collapsed, type) => {}, The callback function, executed by clicking the trigger or activating the responsive layout.

## Methods

No public methods.

## Usage Recommendations

Use Layout to handling the overall layout of a page.

## Example Code

```tsx
import { useState } from 'react';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, VideoCameraOutlined, } from '@ant-design/icons';
import { Layout, Menu } from 'antd';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            { key: '1', icon: <UserOutlined />, label: 'nav 1' }, { key: '2', icon: <VideoCameraOutlined />, label: 'nav 2' }, ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          {collapsed ? (
            <MenuUnfoldOutlined onClick={() => setCollapsed(false)} />
          ) : (
            <MenuFoldOutlined onClick={() => setCollapsed(true)} />
          )}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>Content</Content>
      </Layout>
    </Layout>
  );
};
```

## Result

Renders a Layout component.

## References
- Component docs: `https://ant.design/components/layout` — use for API details, defaults, and official examples.
- Design guide: `https://ant.design/docs/spec/layout` — use for visual and interaction rules that shape correct usage.