# Table — A table displays rows of data.

## Overview

A table displays rows of data.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- To display a collection of structured data.
- To sort, search, paginate, filter data.
## Input Fields

### Table Props

#### Required

- No required properties.

#### Optional

- `bordered`: boolean, Whether to show all table borders. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `columns`: [ColumnsType](#column)\[], Columns of table.
- `components`: [TableComponents](https://github.com/react-component/table/blob/75ee0064e54a4b3215694505870c9d6c817e9e4a/src/interface.ts#L129), Override default table elements.
- `dataSource`: object\[], Data record array to be displayed.
- `expandable`: [expandable](#expandable), Config expandable content.
- `footer`: function(currentPageData), Table footer renderer.
- `getPopupContainer`: (triggerNode) => HTMLElement, The render container of dropdowns in table. Default () => TableHtmlElement.
- `loading`: boolean | [Spin Props](/components/spin/#api), Loading status of table. Default false.
- `locale`: object, The i18n text including filter, sort, empty text, etc. Default [Default Value](https://github.com/ant-design/ant-design/blob/6dae4a7e18ad1ba193aedd5ab6867e1d823e2aa4/components/locale/en_US.tsx#L19-L37).
- `pagination`: object | `false`, Config of pagination. You can ref table pagination [config](#pagination) or full [`pagination`](/components/pagination/) document, hide it by setting it to `false`.
- `rowClassName`: function(record, index): string, Row's className.
- `rowKey`: string | function(record): string, Row's unique key, could be a string or function that returns a string. Default `key`.
- `rowSelection`: object, Row selection [config](#rowselection).
- `rowHoverable`: boolean, Row hover. Default true. Version 5.16.0.
- `scroll`: object, Whether the table can be scrollable, [config](#scroll).
- `showHeader`: boolean, Whether to show table header. Default true.
- `showSorterTooltip`: boolean | [Tooltip props](/components/tooltip/#api) & `{target?: 'full-header' | 'sorter-icon' }`, The header show next sorter direction tooltip. It will be set as the property of Tooltip if its type is object. Default { target: 'full-header' }. Version 5.16.0.
- `size`: `large` | `middle` | `small`, Size of table. Default `large`.
- `sortDirections`: Array, Supported sort way, could be `ascend`, `descend`. Default \[`ascend`, `descend`].
- `sticky`: boolean | `{offsetHeader?: number, offsetScroll?: number, getContainer?: () => HTMLElement}`, Set sticky header and scroll bar. Version 4.6.0 (getContainer: 4.7.0).
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `summary`: (currentData) => ReactNode, Summary content.
- `tableLayout`: - | `auto` | `fixed`, The [table-layout](https://developer.mozilla.org/en-US/docs/Web/CSS/table-layout) attribute of table element. Default -<hr />`fixed` when header/columns are fixed, or using `column.ellipsis`.
- `title`: function(currentPageData), Table title renderer.
- `virtual`: boolean, Support virtual list. Version 5.9.0.
- `onChange`: function(pagination, filters, sorter, extra: { currentDataSource: \[], action: `paginate` | `sort` | `filter` }), Callback executed when pagination, filters or sorter is changed.
- `onHeaderRow`: function(columns, index), Set props on per header row.
- `onRow`: function(record, index), Set props on per row.
- `onScroll`: function(event), Triggered when the table body is scrolled. Note that only vertical scrolling will trigger the event when `virtual`. Version 5.16.0.

### Table ref

#### Required

- No required properties.

#### Optional

- `nativeElement`: HTMLDivElement, The wrap element. Default 5.11.0. Version 5.11.0.
- `scrollTo`: (config: { index?: number, key?: React.Key, top?: number, offset?: number }) => void, Trigger to scroll to target position. `key` match with record `rowKey`. When `offset` is specified, the table will scroll to align the target row to the top with the given offset and not working with `top`. Default 5.11.0. Version 5.11.0.

### Column Props

#### Required

- No required properties.

#### Optional

- `align`: `left` | `right` | `center`, The specify which way that column is aligned. Default `left`.
- `className`: string, The className of this column.
- `colSpan`: number, Span of this column's title.
- `dataIndex`: string | string\[], Display field of the data record, support nest path by string array.
- `defaultFilteredValue`: string\[], Default filtered values.
- `filterResetTo. DefaultFilteredValue`: boolean, click the reset button, whether to restore the default filter. Default false.
- `defaultSortOrder`: `ascend` | `descend`, Default order of sorted values.
- `ellipsis`: boolean | {showTitle?: boolean }, The ellipsis cell content, not working with sorter and filters for now.<br />tableLayout would be `fixed` when `ellipsis` is `true` or `{ showTitle?: boolean }`. Default false. Version showTitle: 4.3.0.
- `filterDropdown`: ReactNode | (props: [FilterDropdownProps](https://github.com/ant-design/ant-design/blob/ecc54dda839619e921c0ace530408871f0281c2a/components/table/interface.tsx#L79)) => ReactNode, Customized filter overlay.
- `filtered`: boolean, Whether the `dataSource` is filtered. Default false.
- `filteredValue`: string\[], Controlled filtered value, filter icon will highlight.
- `filterIcon`: ReactNode | (filtered: boolean) => ReactNode, Customized filter icon.
- `filterOnClose`: boolean, Whether to trigger filter when the filter menu closes. Default true. Version 5.15.0.
- `filterMultiple`: boolean, Whether multiple filters can be selected. Default true.
- `filterMode`: 'menu' | 'tree', To specify the filter interface. Default 'menu'. Version 4.17.0.
- `filterSearch`: boolean | function(input, record):boolean, Whether to be searchable for filter menu. Default false. Version boolean:4.17.0 function:4.19.0.
- `filters`: object\[], Filter menu config.
- `filterDropdownProps`: [DropdownProps](/components/dropdown#api), Customized dropdown props, `filterDropdownOpen` and `onFilterDropdownOpenChange` were available before `<5.22.0`. Version 5.22.0.
- `fixed`: boolean | string, (IE not support) Set column to be fixed: `true`(same as `'start'`) `'start'` `'end'`. Default false.
- `key`: string, Unique key of this column, you can ignore this prop if you've set a unique `dataIndex`.
- `render`: (value: V, record: T, index: number): ReactNode, Renderer of the table cell. `value` is the value of current cell; `record` is the value object of current row; `index` is the row number. The return value should be a ReactNode.
- `responsive`: [Breakpoint](https://github.com/ant-design/ant-design/blob/015109b42b85c63146371b4e32b883cf97b088e8/components/_util/responsiveObserve.ts#L1)\[], The list of breakpoints at which to display this column. Always visible if not set. Version 4.2.0.
- `rowScope`: `row` | `rowgroup`, Set scope attribute for all cells in this column. Version 5.1.0.
- `shouldCellUpdate`: (record, prevRecord) => boolean, Control cell render logic. Version 4.3.0.
- `showSorterTooltip`: boolean | [Tooltip props](/components/tooltip/) & `{target?: 'full-header' | 'sorter-icon' }`, If header show next sorter direction tooltip, override `showSorterTooltip` in table. Default { target: 'full-header' }. Version 5.16.0.
- `sortDirections`: Array, Supported sort way, override `sortDirections` in `Table`, could be `ascend`, `descend`. Default \[`ascend`, `descend`].
- `sorter`: function | boolean | { compare: function, multiple: number }, Sort function for local sort, see [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)'s compareFunction. If it is server-side sorting, set to `true`, but if you want to support multi-column sorting, you can set it to `{ multiple: number }`.
- `sortOrder`: `ascend` | `descend` | null, Order of sorted values: `ascend` `descend` `null`.
- `sortIcon`: (props: { sortOrder }) => ReactNode, Customized sort icon. Version 5.6.0.
- `title`: ReactNode | ({ sortColumns, filters }) => ReactNode, Title of this column.
- `width`: string | number, Width of this column ([width not working?](https://github.com/ant-design/ant-design/issues/13825#issuecomment-449889241)).
- `minWidth`: number, Min width of this column, only works when `tableLayout="auto"`. Version 5.21.0.
- `hidden`: boolean, Hidden this column. Default false. Version 5.13.0.
- `onCell`: function(record, rowIndex), Set props on per cell.
- `onFilter`: function(value, record) => boolean, Function that determines if the row is displayed when filtered.
- `onHeaderCell`: function(column), Set props on per header cell.

### ColumnGroup Props

#### Required

- No required properties.

#### Optional

- `title`: ReactNode, Title of the column group.

### pagination Props

#### Required

- No required properties.

#### Optional

- `placement`: Array, Specify the placement of `Pagination`, could be`topStart` | `topCenter` | `topEnd` |`bottomStart` | `bottomCenter` | `bottomEnd` | `none`. Default \[`bottomEnd`].
- `~~position~~`: Array, Specify the position of `Pagination`, could be`topLeft` | `topCenter` | `topRight` |`bottomLeft` | `bottomCenter` | `bottomRight` | `none`, please use `placement` instead. Default \[`bottomRight`].

### expandable Props

#### Required

- No required properties.

#### Optional

- `childrenColumnName`: string, The column contains children to display. Default children.
- `columnTitle`: ReactNode, Set the title of the expand column. Version 4.23.0.
- `columnWidth`: string | number, Set the width of the expand column.
- `defaultExpandAllRows`: boolean, Expand all rows initially. Default false.
- `defaultExpandedRowKeys`: string\[], Initial expanded row keys.
- `expandedRowClassName`: string | (record, index, indent) => string, Expanded row's className. Version string: 5.22.0.
- `expandedRowKeys`: string\[], Current expanded row keys.
- `expandedRowRender`: function(record, index, indent, expanded): ReactNode, Expanded container render for each row.
- `expandIcon`: function(props): ReactNode, Customize row expand Icon. Ref [example](https://codesandbox.io/s/fervent-bird-nuzpr).
- `expandRowByClick`: boolean, Whether to expand row by clicking anywhere in the whole row. Default false.
- `fixed`: boolean | string, Whether the expansion icon is fixed. Optional true `left` `right`. Default false. Version 4.16.0.
- `indentSize`: number, Indent size in pixels of tree data. Default 15.
- `rowExpandable`: (record) => boolean, Enable row can be expandable.
- `showExpandColumn`: boolean, Show expand column. Default true. Version 4.18.0.
- `onExpand`: function(expanded, record), Callback executed when the row expand icon is clicked.
- `onExpandedRowsChange`: function(expandedRows), Callback executed when the expanded rows change.
- `~~expandedRowOffset~~`: number, Deprecated: Expand the number of offset columns of the row. After setting, it will force the columns in front of it to be fixed columns. Please use'Table. EXPAND_COLUMN 'instead and control the position through column order. Version 5.26.0.

### rowSelection Props

#### Required

- No required properties.

#### Optional

- `align`: `left` | `right` | `center`, Set the alignment of selection column. Default `left`. Version 5.25.0.
- `checkStrictly`: boolean, Check table row precisely; parent row and children rows are not associated. Default true. Version 4.4.0.
- `columnTitle`: ReactNode | (originalNode: ReactNode) => ReactNode, Set the title of the selection column.
- `columnWidth`: string | number, Set the width of the selection column. Default `32px`.
- `fixed`: boolean, Fixed selection column on the left.
- `getCheckboxProps`: function(record), Get Checkbox or Radio props.
- `getTitleCheckboxProps`: function(), Get title Checkbox props.
- `hideSelectAll`: boolean, Hide the selectAll checkbox and custom selection. Default false. Version 4.3.0.
- `preserveSelectedRowKeys`: boolean, Keep selection `key` even when it removed from `dataSource`. Version 4.4.0.
- `renderCell`: (checked: boolean, record: T, index: number, originNode: ReactNode): ReactNode, Renderer of the table cell. Same as `render` in column. Version 4.1.0.
- `selectedRowKeys`: string\[] | number\[], Controlled selected row keys. Default \[].
- `defaultSelectedRowKeys`: string\[] | number\[], key, \[].
- `selections`: object\[] | boolean, Custom selection [config](#selection), only displays default selections when set to `true`.
- `type`: `checkbox` | `radio`, `checkbox` or `radio`. Default `checkbox`.
- `onCell`: function(record, rowIndex), Set props on per cell. Same as `onCell` in column. Version 5.5.0.
- `onChange`: function(selectedRowKeys, selectedRows, info: { type }), Callback executed when selected rows change. Version `info.type`: 4.21.0.
- `onSelect`: function(record, selected, selectedRows, nativeEvent), Callback executed when select/deselect one row.

### scroll Props

#### Required

- No required properties.

#### Optional

- `scrollToFirstRowOnChange`: boolean, Whether to scroll to the top of the table when paging, sorting, filtering changes.
- `x`: string | number | true, Set horizontal scrolling, can also be used to specify the width of the scroll area, could be number, percent value, true and ['max-content'](https://developer.mozilla.org/en-US/docs/Web/CSS/width#max-content).
- `y`: string | number, Set vertical scrolling, can also be used to specify the height of the scroll area, could be string or number.

### selection Props

#### Required

- No required properties.

#### Optional

- `key`: string, Unique key of this selection.
- `text`: ReactNode, Display text of this selection.
- `onSelect`: function(changeableRowKeys), Callback executed when this selection is clicked.

## Methods

No public methods.

## Common Scenario Examples

### Details

```tsx
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType<DataType> = [
  { title: 'Name', dataIndex: 'name', key: 'name' }, { title: 'Age', dataIndex: 'age', key: 'age' }, { title: 'Address', dataIndex: 'address', key: 'address' }, ];

const dataSource: DataType[] = [
  { key: '1', name: 'John', age: 32, address: 'New York' }, { key: '2', name: 'Jane', age: 28, address: 'London' }, ];

const App: React.FC = () => <Table columns={columns} dataSource={dataSource} />;
```

### Details

```tsx
const columns: TableColumnsType<DataType> = [
  {
    title: 'Name', dataIndex: 'name', filters: [
      { text: 'John', value: 'John' }, { text: 'Jane', value: 'Jane' }, ], onFilter: (value, record) => record.name.includes(value as string), filterSearch: true, }, {
    title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, sortDirections: ['descend', 'ascend'], }, ];
```

### Ajax

```tsx
const App: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10 }, });

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/users?${qs.stringify(tableParams)}`)
      .then((res) => res.json())
      .then(({ results, total }) => {
        setData(results);
        setTableParams((prev) => ({
          .prev, pagination: { .prev.pagination, total }, }));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize]);

  const handleTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter) => {
    setTableParams({ pagination, filters, sortOrder: sorter.order, sortField: sorter.field });
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={tableParams.pagination}
      loading={loading}
      onChange={handleTableChange}
    />
  );
};
```

### Details

```tsx
const App: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const rowSelection: TableProps<DataType>['rowSelection'] = {
    selectedRowKeys, onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }, getCheckboxProps: (record) => ({
      disabled: record.name === 'Disabled User', }), };

  return <Table rowSelection={rowSelection} columns={columns} dataSource={dataSource} />;
};
```

### Details

```tsx
interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: DataType;
  children: ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing, dataIndex, title, record, children, .restProps
}) => (
  <td {.restProps}>
    {editing ? (
      <Form.Item name={dataIndex} style={{ margin: 0 }}>
        <Input />
      </Form.Item>
    ) : (
      children
    )}
  </td>
);

<Table components={{ body: { cell: EditableCell } }} columns={mergedColumns} dataSource={data} />;
```

### Details

```tsx
const dataSource = [
  {
    key: '1', name: 'Parent 1', children: [
      { key: '1-1', name: 'Child 1-1' }, { key: '1-2', name: 'Child 1-2' }, ], }, ];

<Table columns={columns} dataSource={dataSource} />;
```

### Details

```tsx
<Table columns={columns} dataSource={dataSource} scroll={{ x: 1500, y: 300 }} />
```

### Virtual list

```tsx
<Table
  virtual
  columns={columns}
  dataSource={largeDataSource}
  scroll={{ x: 2000, y: 500 }}
  pagination={false}
/>
```

### Scenario

| Scenario | Related demo |
| --- | --- |
| Basic table | Basic Usage |
| Row selection | selection |
| Expandable rows | Expandable Row |
| Editable cells | Editable Cells |
| Fixed columns / scroll | Fixed Columns |
| Virtual list | Virtual list |

### Details

```tsx
import type { GetProp, TableColumnsType, TableProps } from 'antd';

type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;
type ColumnsType<T> = TableColumnsType<T>;
type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];
```

## Usage Recommendations

Use Table to a table displays rows of data.

## Example Code

```tsx
import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
];

const data: DataType[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
  },
];

const App: React.FC = () => <Table<DataType> columns={columns} dataSource={data} />;

export default App;
```

## Result

Renders a Table component.

## References
- Component docs: `https://ant.design/components/table` — use for API details, defaults, and official examples.