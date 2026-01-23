# Pagination — A long list can be divided into several pages, and only one page will be loaded at a time.

## Overview

A long list can be divided into several pages, and only one page will be loaded at a time.

## When To Use

- When it will take a long time to load/render all items.
- If you want to browse the data by navigating through pages.
## Input Fields

### Pagination Props

#### Required

- No required properties.

#### Optional

- `align`: start | center | end, Align. Version 5.19.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `current`: number, Current page number.
- `defaultCurrent`: number, Default initial page number. Default 1.
- `defaultPageSize`: number, Default number of data items per page. Default 10.
- `disabled`: boolean, Disable pagination.
- `hideOnSinglePage`: boolean, Whether to hide pager on single page. Default false.
- `itemRender`: (page, type: 'page' | 'prev' | 'next', originalElement) => React.ReactNode, To customize item's innerHTML.
- `pageSize`: number, Number of data items per page.
- `pageSizeOptions`: number\[], Specify the sizeChanger options. Default \[`10`, `20`, `50`, `100`].
- `responsive`: boolean, If `size` is not specified, `Pagination` would resize according to the width of the window.
- `showLessItems`: boolean, Show less page items. Default false.
- `showQuickJumper`: boolean | { goButton: ReactNode }, Determine whether you can jump to pages directly. Default false.
- `showSizeChanger`: boolean | [SelectProps](/components/select#api), Determine whether to show `pageSize` select. Version SelectProps: 5.21.0.
- `totalBoundaryShowSizeChanger`: number, When `total` larger than it, `showSizeChanger` will be true. Default 50.
- `showTitle`: boolean, Show page item's title. Default true.
- `showTotal`: function(total, range), To display the total number and range.
- `simple`: boolean | { readOnly?: boolean }, Whether to use simple mode.
- `size`: `large` | `middle` | `small`, Component size. Default `middle`.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `total`: number, Total number of data items. Default 0.
- `onChange`: function(page, pageSize), Called when the page number or `pageSize` is changed, and it takes the resulting page number and pageSize as its arguments.
- `onShowSizeChange`: function(current, size), Called when `pageSize` is changed.

## Methods

No public methods.

## Usage Recommendations

Use Pagination to a long list can be divided into several pages, and only one page will be loaded at a time.

## Example Code

```tsx
import { Pagination, Space } from 'antd';
import type { PaginationProps } from 'antd';

const App: React.FC = () => {
  const onChange: PaginationProps['onChange'] = (page, pageSize) => {
    console.log('Page:', page, 'PageSize:', pageSize);
  };

  const showTotal: PaginationProps['showTotal'] = (total, range) =>
    `${range[0]}-${range[1]} of ${total} items`;

  return (
    <Space direction="vertical">
      <Pagination defaultCurrent={1} total={50} />

      <Pagination
        showSizeChanger
        showQuickJumper
        showTotal={showTotal}
        defaultCurrent={3}
        total={500}
        onChange={onChange}
      />

      <Pagination size="small" total={50} />

      <Pagination simple defaultCurrent={2} total={50} />

      <Pagination current={1} pageSize={10} total={100} onChange={onChange} />

      <Pagination align="center" defaultCurrent={1} total={50} />

      <Pagination disabled defaultCurrent={1} total={50} />
    </Space>
  );
};
```

## Result

Renders a Pagination component.

## References
- Component docs: `https://ant.design/components/pagination` — use for API details, defaults, and official examples.