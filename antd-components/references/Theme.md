# Theme — Components that can convert text into QR codes, and support custom color and logo.

## Overview

Components that can convert text into QR codes, and support custom color and logo.

## When To Use

- Used when the text needs to be converted into a QR Code.
## Input Fields

### Theme Props

#### Required

- No required properties.

#### Optional

- `token`: `AliasToken`, Design Token.
- `inherit`: boolean, ConfigProvider, true.
- `algorithm`: `(token: SeedToken) => MapToken` | `((token: SeedToken) => MapToken)[]`, Seed Token  Map Token, `defaultAlgorithm`.
- `components`: `ComponentsConfig`, Component Token  Alias Token.
- `cssVar`: [cssVar](#css-var), CSS .
- `hashed`: boolean, hash className, true.
- `zeroRuntime`: boolean,   CSS, true, Version 6.0.0.

### ComponentsConfig Props

#### Required

- No required properties.

#### Optional

- ``Component` ( antd, `Button`)`: `ComponentToken & AliasToken & { algorithm: boolean | (token: SeedToken) => MapToken`|`((token: SeedToken) => MapToken)[]}`, Component Token  Alias Token.

### cssVar Props

#### Required

- No required properties.

#### Optional

- `prefix`: string, CSS, ConfigProvider  `prefixCls`, `ant`.
- `key`: string, key, `useId`, `useId` in React 18.

## Methods

No public methods.

## Usage Recommendations

Use Theme to components that can convert text into QR codes, and support custom color and logo.

## Example Code

```tsx
import { Button, ConfigProvider, Space, theme } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical">
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b', }, }}
    >
      <Button type="primary">Green Primary</Button>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, }}
    >
      <div style={{ background: '#141414', padding: 24 }}>
        <Button type="primary">Dark Theme</Button>
      </div>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        algorithm: theme.compactAlgorithm, }}
    >
      <Button type="primary">Compact Theme</Button>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm, theme.compactAlgorithm], }}
    >
      <div style={{ background: '#141414', padding: 24 }}>
        <Button type="primary">Dark Compact</Button>
      </div>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: '#00b96b', algorithm: true, // Text
          }, }, }}
    >
      <Button type="primary">Custom Button</Button>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        token: { colorPrimary: '#1677ff' }, }}
    >
      <Button type="primary">Blue</Button>
      <ConfigProvider
        theme={{
          token: { colorPrimary: '#00b96b' }, }}
      >
        <Button type="primary">Green</Button>
      </ConfigProvider>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        cssVar: true, hashed: false, }}
    >
      <Button type="primary">CSS Variables</Button>
    </ConfigProvider>
  </Space>
);

const ThemeInfo: React.FC = () => {
  const { token } = theme.useToken();

  return <div style={{ color: token.colorPrimary }}>Primary Color: {token.colorPrimary}</div>;
};
```

## Result

Renders a Theme component.

## References
- Component docs: `https://ant.design/components/theme` — use for API details, defaults, and official examples.