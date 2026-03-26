# Icon — Semantic vector graphics.

## Overview

Semantic vector graphics.

## When To Use

- Use Icon to semantic vector graphics.
## Input Fields

### Props

#### Required

- No required properties.

#### Optional

- `className`: string, The className of Icon.
- `rotate`: number, Rotate by n degrees (not working in IE9).
- `spin`: boolean, Rotate icon with animation. Default false.
- `style`: CSSProperties, The style properties of icon, like `fontSize` and `color`.
- `twoToneColor`: string (hex color), Only supports the two-tone icon. Specify the primary color.

### Icon

#### Required

- No required properties.

#### Optional

- `component`: ComponentType&lt;CustomIconComponentProps>, The component used for the root node.
- `rotate`: number, Rotate degrees (not working in IE9).
- `spin`: boolean, Rotate icon with animation. Default false.
- `style`: CSSProperties, The style properties of icon, like `fontSize` and `color`.

### <use>

#### Required

- No required properties.

#### Optional

- `extraCommonProps`: { \[key: string]: any }, `svg`  `<Icon />`, {}.
- `scriptUrl`: string | string\[], [iconfont.cn](http://iconfont.cn/)  js, `@ant-design/icons@4.1.0`  `string[]` .

## Methods

No public methods.

## Usage Recommendations

Use Icon to semantic vector graphics.

## Example Code

```tsx
import Icon, {
  CheckCircleTwoTone, createFromIconfontCN, HeartTwoTone, HomeOutlined, LoadingOutlined, SettingFilled, SmileOutlined, SmileTwoTone, SyncOutlined, } from '@ant-design/icons';
import { Button, Space } from 'antd';
import type { GetProps } from 'antd';

const App: React.FC = () => (
  <Space size="large">
    <HomeOutlined />
    <SettingFilled />
    <SmileOutlined />

    <SyncOutlined spin />
    <LoadingOutlined />

    <SmileOutlined rotate={180} />

    <SmileTwoTone />
    <HeartTwoTone twoToneColor="#eb2f96" />
    <CheckCircleTwoTone twoToneColor="#52c41a" />

    <Button type="primary" icon={<HomeOutlined />}>
      Home
    </Button>
    <Button icon={<SettingFilled />} />

    <HomeOutlined style={{ fontSize: '24px', color: '#08c' }} />
  </Space>
);

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js', });

const IconfontDemo: React.FC = () => (
  <Space>
    <IconFont type="icon-tuichu" />
    <IconFont type="icon-facebook" />
    <IconFont type="icon-twitter" />
  </Space>
);

type CustomIconComponentProps = GetProps<typeof Icon>;

const HeartSvg = () => (
  <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
    <path d="M923 283.6c-13.4-31.1-32.6-59.2-56.9-83.5." />
  </svg>
);

const HeartIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={HeartSvg} {...props} />
);

const CustomIconDemo: React.FC = () => <HeartIcon style={{ color: 'hotpink' }} />;
```

## Result

Renders an Icon component.

## References
- Component docs: `https://ant.design/components/icon` — use for API details, defaults, and official examples.