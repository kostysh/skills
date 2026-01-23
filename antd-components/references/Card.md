# Card — A container for displaying information.

## Overview

A container for displaying information.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- A card can be used to display content related to a single subject. The content can consist of multiple elements of varying types and sizes.
## Input Fields

### Card Props

#### Required

- No required properties.

#### Optional

- `actions`: Array&lt;ReactNode>, The action list, shows at the bottom of the Card.
- `activeTabKey`: string, Current TabPane's key.
- `~~bordered~~`: boolean, Toggles rendering of the border around the card, please use `variant` instead. Default true.
- `variant`: `outlined` | `borderless` |, Variants of Card. Default `outlined`. Version 5.24.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `cover`: ReactNode, Card cover.
- `defaultActiveTabKey`: string, Initial active TabPane's key, if `activeTabKey` is not set. Default `The key of first tab`.
- `extra`: ReactNode, Content to render in the top-right corner of the card.
- `hoverable`: boolean, Lift up when hovering card. Default false.
- `loading`: boolean, Shows a loading indicator while the contents of the card are being fetched. Default false.
- `size`: `default` | `small`, Size of card. Default `default`.
- `tabBarExtraContent`: ReactNode, Extra content in tab bar.
- `tabList`: [TabItemType](/components/tabs#tabitemtype)[], List of TabPane's head.
- `tabProps`: -, [Tabs](/components/tabs/#tabs).
- `title`: ReactNode, Card title.
- `type`: string, Card style type, can be set to `inner` or not set.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `onTabChange`: (key) => void, Callback when tab is switched.

### Card.Grid Props

#### Required

- No required properties.

#### Optional

- `className`: string, The className of container.
- `hoverable`: boolean, Lift up when hovering card grid. Default true.
- `style`: CSSProperties, The style object of container.

### Card.Meta Props

#### Required

- No required properties.

#### Optional

- `avatar`: ReactNode, Avatar or icon.
- `className`: string, The className of container.
- `description`: ReactNode, Description content.
- `style`: CSSProperties, The style object of container.
- `title`: ReactNode, Title content.

## Methods

No public methods.

## Usage Recommendations

Use Card to a container for displaying information.

## Example Code

```tsx
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Avatar, Card } from 'antd';

const { Meta } = Card;

const App: React.FC = () => (
  <Card
    style={{ width: 300 }}
    cover={<img alt="example" src="https://example.com/image.jpg" />}
    actions={[
      <SettingOutlined key="setting" />, <EditOutlined key="edit" />, <EllipsisOutlined key="ellipsis" />, ]}
  >
    <Meta
      avatar={<Avatar src="https://example.com/avatar.jpg" />}
      title="Card title"
      description="This is the description"
    />
  </Card>
);
```

## Result

Renders a Card component.

## References
- Component docs: `https://ant.design/components/card` — use for API details, defaults, and official examples.