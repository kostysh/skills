# Typography — Basic text writing, including headings, body text, lists, and more.

## Overview

Basic text writing, including headings, body text, lists, and more.

## When To Use

- When you need to display a title or paragraph contents in Articles/Blogs/Notes.
- When you need copyable/editable/ellipsis texts.
## Input Fields

### Typography.Text Props

#### Required

- No required properties.

#### Optional

- `code`: boolean, Code style. Default false.
- `copyable`: boolean | [copyable](#copyable), Whether to be copyable, customize it via setting an object. Default false.
- `delete`: boolean, Deleted line style. Default false.
- `disabled`: boolean, Disabled content. Default false.
- `editable`: boolean | [editable](#editable), If editable. Can control edit state when is object. Default false.
- `ellipsis`: boolean | [Omit<ellipsis, 'expandable' | 'rows' | 'onExpand'>](#ellipsis), Display ellipsis when text overflows, can't configure expandable, rows and onExpand by using object. Diff with Typography.Paragraph, Text do not have 100% width style which means it will fix width on the first ellipsis. If you want to have responsive ellipsis, please set width manually. Default false.
- `keyboard`: boolean, Keyboard style. Default false. Version 4.3.0.
- `mark`: boolean, Marked style. Default false.
- `onClick`: (event) => void, Set the handler to handle click event.
- `strong`: boolean, Bold style. Default false.
- `italic`: boolean, Italic style. Default false. Version 4.16.0.
- `type`: `secondary` | `success` | `warning` | `danger`, Content type. Version success: 4.6.0.
- `underline`: boolean, Underlined style. Default false.

### Typography.Title Props

#### Required

- No required properties.

#### Optional

- `code`: boolean, Code style. Default false.
- `copyable`: boolean | [copyable](#copyable), Whether to be copyable, customize it via setting an object. Default false.
- `delete`: boolean, Deleted line style. Default false.
- `disabled`: boolean, Disabled content. Default false.
- `editable`: boolean | [editable](#editable), If editable. Can control edit state when is object. Default false.
- `ellipsis`: boolean | [ellipsis](#ellipsis), Display ellipsis when text overflows, can configure rows and expandable by using object. Default false.
- `level`: number: 1, 2, 3, 4, 5, Set content importance. Match with `h1`, `h2`, `h3`, `h4`, `h5`. Default 1. Version 5: 4.6.0.
- `mark`: boolean, Marked style. Default false.
- `onClick`: (event) => void, Set the handler to handle click event.
- `italic`: boolean, Italic style. Default false. Version 4.16.0.
- `type`: `secondary` | `success` | `warning` | `danger`, Content type. Version success: 4.6.0.
- `underline`: boolean, Underlined style. Default false.

### Typography.Paragraph Props

#### Required

- No required properties.

#### Optional

- `code`: boolean, Code style. Default false.
- `copyable`: boolean | [copyable](#copyable), Whether to be copyable, customize it via setting an object. Default false.
- `delete`: boolean, Deleted line style. Default false.
- `disabled`: boolean, Disabled content. Default false.
- `editable`: boolean | [editable](#editable), If editable. Can control edit state when is object. Default false.
- `ellipsis`: boolean | [ellipsis](#ellipsis), Display ellipsis when text overflows, can configure rows and expandable by using object. Default false.
- `mark`: boolean, Marked style. Default false.
- `onClick`: (event) => void, Set the handler to handle click event.
- `strong`: boolean, Bold style. Default false.
- `italic`: boolean, Italic style. Default false. Version 4.16.0.
- `type`: `secondary` | `success` | `warning` | `danger`, Content type. Version success: 4.6.0.
- `underline`: boolean, Underlined style. Default false.

### copyable Props

#### Required

- No required properties.

#### Optional

- `format`: 'text/plain' | 'text/html', The Mime Type of the text. Version 4.21.0.
- `icon`: \[ReactNode, ReactNode], Custom copy icon: \[copyIcon, copiedIcon]. Version 4.6.0.
- `text`: string, The text to copy.
- `tooltips`: \[ReactNode, ReactNode], Custom tooltip text, hide when it is false. Default \[`Copy`, `Copied`]. Version 4.4.0.
- `onCopy`: function, Called when copied text.
- `tabIndex`: number, Set tabIndex of the copy button. Default 0. Version 5.17.0.

### editable Props

#### Required

- No required properties.

#### Optional

- `autoSize`: boolean | { minRows: number, maxRows: number }, `autoSize` attribute of textarea. Version 4.4.0.
- `editing`: boolean, Whether to be editable. Default false.
- `icon`: ReactNode, Custom editable icon. Default &lt;EditOutlined />. Version 4.6.0.
- `maxLength`: number, `maxLength` attribute of textarea. Version 4.4.0.
- `tooltip`: ReactNode, Custom tooltip text, hide when it is false. Default `Edit`. Version 4.6.0.
- `text`: string, Edit text, specify the editing content instead of using the children implicitly. Version 4.24.0.
- `onChange`: function(value: string), Called when input at textarea.
- `onCancel`: function, Called when type ESC to exit editable state.
- `onStart`: function, Called when enter editable state.
- `onEnd`: function, Called when type ENTER to exit editable state. Version 4.14.0.
- `triggerType`: Array&lt;`icon`|`text`>, Edit mode trigger - icon, text or both (not specifying icon as trigger hides it). Default \[`icon`].
- `enterIcon`: ReactNode, Custom "enter" icon in the edit field (passing `null` removes the icon). Default `<EnterOutlined />`. Version 4.17.0.
- `tabIndex`: number, Set tabIndex of the edit button. Default 0. Version 5.17.0.

### ellipsis Props

#### Required

- No required properties.

#### Optional

- `expandable`: boolean | 'collapsible', Whether to be expandable. Version `collapsible`: 5.16.0.
- `rows`: number, Max rows of content.
- `suffix`: string, Suffix of ellipsis content.
- `symbol`: ReactNode | ((expanded: boolean) => ReactNode), Custom description of ellipsis. Default `Expand` `Collapse`.
- `tooltip`: ReactNode | [TooltipProps](/components/tooltip/#api), Show tooltip when ellipsis. Version 4.11.0.
- `defaultExpanded`: boolean, Default expand or collapse. Version 5.16.0.
- `expanded`: boolean, Expand or Collapse. Version 5.16.0.
- `onEllipsis`: function(ellipsis), Called when enter or leave ellipsis state. Version 4.2.0.
- `onExpand`: function(event, { expanded: boolean }), Called when expand content. Version `info`: 5.16.0.

## Methods

No public methods.

## Usage Recommendations

Use Typography to basic text writing, including headings, body text, lists, and more.

## Example Code

```tsx
import { Divider, Space, Typography } from 'antd';

const { Title, Text, Paragraph, Link } = Typography;

const App: React.FC = () => (
  <Space direction="vertical">
    <Title>h1. Ant Design</Title>
    <Title level={2}>h2. Ant Design</Title>
    <Title level={3}>h3. Ant Design</Title>
    <Title level={4}>h4. Ant Design</Title>
    <Title level={5}>h5. Ant Design</Title>

    <Divider />

    <Text>Ant Design (default)</Text>
    <Text type="secondary">Ant Design (secondary)</Text>
    <Text type="success">Ant Design (success)</Text>
    <Text type="warning">Ant Design (warning)</Text>
    <Text type="danger">Ant Design (danger)</Text>
    <Text disabled>Ant Design (disabled)</Text>
    <Text mark>Ant Design (mark)</Text>
    <Text code>Ant Design (code)</Text>
    <Text keyboard>Ant Design (keyboard)</Text>
    <Text underline>Ant Design (underline)</Text>
    <Text delete>Ant Design (delete)</Text>
    <Text strong>Ant Design (strong)</Text>
    <Text italic>Ant Design (italic)</Text>
    <Link href="https://ant.design" target="_blank">
      Ant Design (Link)
    </Link>

    <Divider />

    <Paragraph copyable>This is a copyable text.</Paragraph>
    <Paragraph copyable={{ text: 'Hello, Ant Design!' }}>Replace text when copy.</Paragraph>

    <Paragraph editable>This is an editable text.</Paragraph>

    <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
      Ant Design, a design language for background applications, is refined by Ant UED Team. Ant
      Design, a design language for background applications, is refined by Ant UED Team. Ant Design, a design language for background applications, is refined by Ant UED Team.
    </Paragraph>

    <Paragraph ellipsis={{ rows: 1, tooltip: 'Full text here' }}>
      Ant Design, a design language for background applications.
    </Paragraph>
  </Space>
);
```

## Result

Renders a Typography component.

## References
- Component docs: `https://ant.design/components/typography` — use for API details, defaults, and official examples.