# Avatar — Used to represent users or things, supporting the display of images, icons, or characters.

## Overview

Used to represent users or things, supporting the display of images, icons, or characters.

## When To Use

- Use Avatar to used to represent users or things, supporting the display of images, icons, or characters.
## Input Fields

### Avatar Props

#### Required

- No required properties.

#### Optional

- `alt`: string, This attribute defines the alternative text describing the image.
- `gap`: number, Letter type unit distance between left and right sides. Default 4. Version 4.3.0.
- `icon`: ReactNode, Custom icon type for an icon avatar.
- `shape`: `circle` | `square`, The shape of avatar. Default `circle`.
- `size`: number | `large` | `small` | `default` | { xs: number, sm: number, ...}, The size of the avatar. Default `default`. Version 4.7.0.
- `src`: string | ReactNode, The address of the image for an image avatar or image element. Version ReactNode: 4.8.0.
- `srcSet`: string, A list of sources to use for different screen resolutions.
- `draggable`: boolean | `'true'` | `'false'`, Whether the picture is allowed to be dragged. Default true.
- `crossOrigin`: `'anonymous'` | `'use-credentials'` | `''`, CORS settings attributes. Version 4.17.0.
- `onError`: () => boolean, Handler when img load error, return false to prevent default fallback behavior.

### Avatar.Group <Badge>4.5.0+</Badge>

#### Required

- No required properties.

#### Optional

- `max`: `{ count?: number; style?: CSSProperties; popover?: PopoverProps }`, Set maximum display related configurations, Before `5.18.0` you can use [parameters](https://github.com/ant-design/ant-design/blob/9d134859becbdae5b9ce276f6d9af4264691d81f/components/avatar/group.tsx#L35-L38). Version 5.18.0.
- `size`: number | `large` | `small` | `default` | { xs: number, sm: number, ...}, The size of the avatar. Default `default`. Version 4.8.0.
- `shape`: `circle` | `square`, The shape of the avatar. Default `circle`. Version 5.8.0.

## Methods

No public methods.

## Usage Recommendations

Use Avatar to used to represent users or things, supporting the display of images, icons, or characters.

## Example Code

```tsx
import { AntDesignOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Divider, Space, Tooltip } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical">
    <Space>
      <Avatar size={64} icon={<UserOutlined />} />
      <Avatar size="large" icon={<UserOutlined />} />
      <Avatar icon={<UserOutlined />} />
      <Avatar size="small" icon={<UserOutlined />} />
    </Space>

    <Space>
      <Avatar icon={<UserOutlined />} />
      <Avatar>U</Avatar>
      <Avatar size={40}>USER</Avatar>
      <Avatar src="https://joeschmoe.io/api/v1/random" />
    </Space>

    <Space>
      <Avatar shape="square" icon={<UserOutlined />} />
      <Avatar shape="square">U</Avatar>
    </Space>

    <Avatar.Group
      max={{
        count: 2, style: { color: '#f56a00', backgroundColor: '#fde3cf' }, }}
    >
      <Avatar src="https://joeschmoe.io/api/v1/random" />
      <Avatar style={{ backgroundColor: '#f56a00' }}>K</Avatar>
      <Tooltip title="User 3">
        <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
      </Tooltip>
      <Avatar style={{ backgroundColor: '#1890ff' }} icon={<AntDesignOutlined />} />
    </Avatar.Group>
  </Space>
);
```

## Result

Renders an Avatar component.

## References
- Component docs: `https://ant.design/components/avatar` — use for API details, defaults, and official examples.