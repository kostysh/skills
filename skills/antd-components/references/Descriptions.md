# Descriptions — Display multiple read-only fields in a group.

## Overview

Display multiple read-only fields in a group.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Commonly displayed on the details page.
- ```tsx | pure
- // works when >= 5.8.0, recommended ✅
- const items: DescriptionsProps['items'] = [
- {
- key: '1',
- label: 'UserName',
- children: <p>Zhou Maomao</p>,
- },
- {
- key: '2',
- label: 'Telephone',
- children: <p>1810000000</p>,
- },
- {
- key: '3',
- label: 'Live',
- children: <p>Hangzhou, Zhejiang</p>,
- },
- {
- key: '4',
- label: 'Remark',
- children: <p>empty</p>,
- },
- {
- key: '5',
- label: 'Address',
- children: <p>No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China</p>,
- },
- ];
- <Descriptions title="User Info" items={items} />;
- // works when <5.8.0 , deprecated when >=5.8.0 🙅🏻‍♀️
- <Descriptions title="User Info">
- <Descriptions.Item label="UserName">Zhou Maomao</Descriptions.Item>
- <Descriptions.Item label="Telephone">1810000000</Descriptions.Item>
- <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
- <Descriptions.Item label="Remark">empty</Descriptions.Item>
- <Descriptions.Item label="Address">
- No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
- </Descriptions.Item>
- </Descriptions>;
- ```
## Input Fields

### Descriptions Props

#### Required

- No required properties.

#### Optional

- `bordered`: boolean, Whether to display the border. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `colon`: boolean, Change default props `colon` value of Descriptions.Item. Indicates whether the colon after the label is displayed. Default true.
- `column`: number | [Record<Breakpoint, number>](https://github.com/ant-design/ant-design/blob/84ca0d23ae52e4f0940f20b0e22eabe743f90dca/components/descriptions/index.tsx#L111C21-L111C56), The number of `DescriptionItems` in a row, could be an object (like `{ xs: 8, sm: 16, md: 24}`, but must have `bordered={true}`) or a number. Default 3.
- `~~contentStyle~~`: CSSProperties, Customize content style, Please use `styles.content` instead. Version 4.10.0.
- `extra`: ReactNode, The action area of the description list, placed at the top-right. Version 4.5.0.
- `items`: [DescriptionsItem](#descriptionitem)[], Describe the contents of the list item. Version 5.8.0.
- `~~labelStyle~~`: CSSProperties, Please use `styles.label` instead, Customize label style. Version 4.10.0.
- `layout`: `horizontal` | `vertical`, Define description layout. Default `horizontal`.
- `size`: `default` | `middle` | `small`, Set the size of the list. Can be set to `middle`,`small`, or not filled.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `title`: ReactNode, The title of the description list, placed at the top.

### DescriptionItem Props

#### Required

- No required properties.

#### Optional

- `~~contentStyle~~`: CSSProperties, Customize content style, Please use `styles.content` instead. Version 4.9.0.
- `label`: ReactNode, The description of the content.
- `~~labelStyle~~`: CSSProperties, Customize label style, Please use `styles.label` instead. Version 4.9.0.
- `span`: number | `filled` | [Screens](/components/grid#col), The number of columns included(`filled` Fill the remaining part of the current row). Default 1. Version `screens: 5.9.0`, `filled: 5.22.0`.

## Methods

No public methods.

## Usage Recommendations

Use Descriptions to display multiple read-only fields in a group.

## Example Code

```tsx
import { Badge, Button, Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';

const items: DescriptionsProps['items'] = [
  {
    key: '1', label: 'Product', children: 'Cloud Database', }, {
    key: '2', label: 'Billing Mode', children: 'Prepaid', }, {
    key: '3', label: 'Automatic Renewal', children: 'YES', }, {
    key: '4', label: 'Order time', children: '2018-04-24 18:00:00', }, {
    key: '5', label: 'Usage Time', children: '2019-04-24 18:00:00', span: 2, }, {
    key: '6', label: 'Status', children: <Badge status="processing" text="Running" />, span: 3, }, {
    key: '7', label: 'Negotiated Amount', children: '$80.00', }, {
    key: '8', label: 'Discount', children: '$20.00', }, {
    key: '9', label: 'Official Receipts', children: '$60.00', }, {
    key: '10', label: 'Config Info', children: (
      <>
        Data disk type: MongoDB
        <br />
        Database version: 3.4
        <br />
        Package: dds.mongo.mid
      </>
    ), }, ];

const App: React.FC = () => (
  <>
    <Descriptions title="User Info" items={items} />

    <Descriptions title="User Info" bordered items={items} />

    <Descriptions title="User Info" extra={<Button type="primary">Edit</Button>} items={items} />

    <Descriptions
      title="Responsive"
      column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
      items={items}
    />
  </>
);
```

## Result

Renders a Descriptions component.

## References
- Component docs: `https://ant.design/components/descriptions` — use for API details, defaults, and official examples.