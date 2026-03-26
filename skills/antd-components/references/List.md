# List — Basic list display, which can carry text, lists, pictures, paragraphs.

## Overview

Basic list display, which can carry text, lists, pictures, paragraphs.

## When To Use

- A list can be used to display content related to a single subject. The content can consist of multiple elements of varying type and size.
- <!-- prettier-ignore -->
- :::warning{title=Deprecated Notice}
- List component has been deprecated. Will be removed in the next major version.
- :::
## Input Fields

### List Props

#### Required

- No required properties.

#### Optional

- `bordered`: boolean, Toggles rendering of the border around the list. Default false.
- `dataSource`: any\[], DataSource array for list.
- `footer`: ReactNode, List footer renderer.
- `grid`: [object](#list-grid-props), The grid type of list. You can set grid to something like {gutter: 16, column: 4}.
- `header`: ReactNode, List header renderer.
- `itemLayout`: `horizontal` | `vertical`, The layout of list. Default `horizontal`.
- `loading`: boolean | [SpinProps](/components/spin/#api) ([more](https://github.com/ant-design/ant-design/issues/8659)), Shows a loading indicator while the contents of the list are being fetched. Default false.
- `loadMore`: ReactNode, Shows a load more content.
- `locale`: object, The i18n text including empty text. Default {emptyText: `No Data`}.
- `pagination`: boolean | object, Pagination [config](/components/pagination/), hide it by setting it to false. Default false.
- `renderItem`: (item: T, index: number) => ReactNode, Customize list item when using `dataSource`.
- `rowKey`: `keyof` T | (item: T) => `React.Key`, Item's unique value, could be an Item's key which holds a unique value of type `React.Key` or function that receives Item and returns a `React.Key`. Default `"key"`.
- `size`: `default` | `large` | `small`, Size of list. Default `default`.
- `split`: boolean, Toggles rendering of the split under the list item. Default true.

### pagination Props

#### Required

- No required properties.

#### Optional

- `position`: `top` | `bottom` | `both`, The specify the position of `Pagination`. Default `bottom`.
- `align`: `start` | `center` | `end`, The specify the alignment of `Pagination`. Default `end`.

### List grid props

#### Required

- No required properties.

#### Optional

- `column`: number, The column of grid.
- `gutter`: number, The spacing between grid. Default 0.
- `xs`: number, `<576px` column of grid.
- `sm`: number, `≥576px` column of grid.
- `md`: number, `≥768px` column of grid.
- `lg`: number, `≥992px` column of grid.
- `xl`: number, `≥1200px` column of grid.
- `xxl`: number, `≥1600px` column of grid.

### List.Item Props

#### Required

- No required properties.

#### Optional

- `actions`: Array&lt;ReactNode>, The actions content of list item. If `itemLayout` is `vertical`, shows the content on bottom, otherwise shows content on the far right.
- `classNames`: [`Record<actions | extra, string>`](#semantic-dom), Semantic structure className. Version 5.18.0.
- `extra`: ReactNode, The extra content of list item. If `itemLayout` is `vertical`, shows the content on right, otherwise shows content on the far right.
- `styles`: [`Record<actions | extra, CSSProperties>`](#semantic-dom), Semantic DOM style. Version 5.18.0.

### List.Item.Meta Props

#### Required

- No required properties.

#### Optional

- `avatar`: ReactNode, The avatar of list item.
- `description`: ReactNode, The description of list item.
- `title`: ReactNode, The title of list item.

## Methods

No public methods.

## Usage Recommendations

Use List to basic list display, which can carry text, lists, pictures, paragraphs.

## Example Code

```tsx
import { LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
import { Avatar, Button, List, Space } from 'antd';

interface DataType {
  href: string;
  title: string;
  avatar: string;
  description: string;
  content: string;
}

const data: DataType[] = [
  {
    href: 'https://ant.design', title: 'ant design part 1', avatar: 'https://joeschmoe.io/api/v1/random', description: 'Ant Design, a design language for background applications.', content: 'We supply a series of design principles.', }, ];

const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);

const App: React.FC = () => (
  <List
    itemLayout="vertical"
    size="large"
    pagination={{ pageSize: 3 }}
    dataSource={data}
    renderItem={(item) => (
      <List.Item
        key={item.title}
        actions={[
          <IconText icon={StarOutlined} text="156" key="star" />, <IconText icon={LikeOutlined} text="156" key="like" />, <IconText icon={MessageOutlined} text="2" key="message" />, ]}
        extra={<img width={272} alt="logo" src="https://example.com/image.png" />}
      >
        <List.Item.Meta
          avatar={<Avatar src={item.avatar} />}
          title={<a href={item.href}>{item.title}</a>}
          description={item.description}
        />
        {item.content}
      </List.Item>
    )}
  />
);
```

## Result

Renders a List component.

## References
- Component docs: `https://ant.design/components/list` — use for API details, defaults, and official examples.