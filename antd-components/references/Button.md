# Button — To trigger an operation.

## Overview

To trigger an operation.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- 🔵 Primary button: used for the main action, there can be at most one primary button in a section.
- ⚪️ Default button: used for a series of actions without priority.
- 😶 Dashed button: commonly used for adding more actions.
- 🔤 Text button: used for the most secondary action.
- 🔗 Link button: used for external links.
- 🔴 `danger`: used for actions of risk, like deletion or authorization.
- 👻 `ghost`: used in situations with complex background, home pages usually.
- 🚫 `disabled`: used when actions are not available.
- 🔃 `loading`: adds a loading spinner in button, avoids multiple submits too.
## Input Fields

### type Props

#### Required

- No required properties.

#### Optional

- `autoInsertSpace`: boolean, We add a space between two Chinese characters by default, which removed by setting `autoInsertSpace` to `false`. Default `true`. Version 5.17.0.
- `block`: boolean, Option to fit button width to its parent width. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `color`: `default` | `primary` | `danger` | [PresetColors](#presetcolors), Set button color. Version `default`, `primary` and `danger`: 5.21.0, `PresetColors`: 5.23.0.
- `danger`: boolean, Syntactic sugar. Set the danger status of button. will follow `color` if provided. Default false.
- `disabled`: boolean, Disabled state of button. Default false.
- `ghost`: boolean, Make background transparent and invert text and border colors. Default false.
- `href`: string, Redirect url of link button.
- `htmlType`: `submit` | `reset` | `button`, Set the original html `type` of `button`, see: [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type). Default `button`.
- `icon`: ReactNode, Set the icon component of button.
- `~~iconPosition~~`: `start` | `end`, Set the icon position of button, please use `iconPlacement` instead. Default `start`. Version 5.17.0.
- `iconPlacement`: `start` | `end`, Set the icon position of button. Default `start`.
- `loading`: boolean | { delay: number, icon: ReactNode }, Set the loading status of button. Default false. Version icon: 5.23.0.
- `shape`: `default` | `circle` | `round`, Can be used to set button shape. Default `default`.
- `size`: `large` | `middle` | `small`, Set the size of button. Default `middle`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `target`: string, Same as target attribute of a, works when href is specified.
- `type`: `primary` | `dashed` | `link` | `text` | `default`, Syntactic sugar. Set button type. Will follow `variant` & `color` if provided. Default `default`.
- `onClick`: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void, Set the handler to handle `click` event.
- `variant`: `outlined` | `dashed` | `solid` | `filled` | `text` | `link`, Set button variant. Version 5.21.0.

## Methods

No public methods.

## Usage Recommendations

Use Button to to trigger an operation.

## Example Code

```tsx
import { Button, Flex } from 'antd';

const App: React.FC = () => (
  <Flex gap="small" wrap>
    <Button type="primary">Primary</Button>
    <Button>Default</Button>
    <Button type="dashed">Dashed</Button>
    <Button type="text">Text</Button>
    <Button type="link">Link</Button>
  </Flex>
);
```

## Result

Renders a Button component.

## References
- Component docs: `https://ant.design/components/button` — use for API details, defaults, and official examples.