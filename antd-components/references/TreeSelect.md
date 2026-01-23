# TreeSelect — Tree selection control.

## Overview

Tree selection control.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- `TreeSelect` is similar to `Select`, but the values are provided in a tree like structure. Any data whose entries are defined in a hierarchical manner is fit to use this control. Examples of such case may include a corporate hierarchy, a directory structure, and so on.
## Input Fields

### Tree props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Customize clear icon. Default false. Version 5.8.0: Support object type.
- `~~autoClearSearchValue~~`: boolean, If auto clear search input value when multiple select is selected/deselected. Default true Deprecated.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultOpen`: boolean, Initial open state of dropdown.
- `defaultValue`: string | string\[], To set the initial selected treeNode(s).
- `disabled`: boolean, Disabled or not. Default false.
- `~~popupClassName~~`: string, The className of dropdown menu, use `classNames.popup.root` instead. Version 4.23.0.
- `popupMatchSelectWidth`: boolean | number, Determine whether the popup menu and the select input are the same width. Default set `min-width` same as input. Will ignore when value less than select width. `false` will disable virtual scroll. Default true. Version 5.5.0.
- `~~dropdownRender~~`: (originNode: ReactNode, props) => ReactNode, Customize dropdown content, use `popupRender` instead.
- `popupRender`: (originNode: ReactNode, props) => ReactNode, Customize dropdown content.
- `~~dropdownStyle~~`: CSSProperties, To set the style of the dropdown menu, use `styles.popup.root` instead.
- `fieldNames`: object, Customize node label, value, children field name. Default { label: `label`, value: `value`, children: `children` }. Version 4.17.0.
- `~~filterTreeNode~~`: boolean | function(inputValue: string, treeNode: TreeNode) (should return boolean), Whether to filter treeNodes by input value. The value of `treeNodeFilterProp` is used for filtering by default. Default function.
- `getPopupContainer`: function(triggerNode), To set the container of the dropdown menu. The default is to create a `div` element in `body`, you can reset it to the scrolling area and make a relative reposition. [example](https://codepen.io/afc163/pen/zEjNOy?editors=0010). Default () => document.body.
- `labelInValue`: boolean, Whether to embed label in value, turn the format of value from `string` to {value: string, label: ReactNode, halfChecked: boolean (Is the option list in a semi selected state and not displayed in the values)}. Default false.
- `listHeight`: number, Config popup height. Default 256.
- `loadData`: function(node), Load data asynchronously. Will not load when filtering. Check FAQ for more info.
- `maxCount`: number, The maximum number of items that can be selected. Only takes effect when `multiple=true`. If (`showCheckedStrategy = 'SHOW_ALL'` and `treeCheckStrictly` is disabled) or `showCheckedStrategy = 'SHOW_PARENT'` is used, `maxCount` will not take effect. Version 5.23.0.
- `maxTagCount`: number | `responsive`, Max tag count to show. `responsive` will cost render performance. Version responsive: 4.10.
- `maxTagPlaceholder`: ReactNode | function(omittedValues), Placeholder for not showing tags.
- `maxTagTextLength`: number, Max tag text length to show.
- `multiple`: boolean, Support multiple or not, will be `true` when enable `treeCheckable`. Default false.
- `notFoundContent`: ReactNode, Specify content to show when no result matches. Default `Not Found`.
- `open`: boolean, Controlled open state of dropdown.
- `placeholder`: string, Placeholder of the select input.
- `placement`: `bottomLeft` `bottomRight` `topLeft` `topRight`, The position where the selection box pops up. Default bottomLeft.
- `prefix`: ReactNode, The custom prefix. Version 5.22.0.
- `~~searchValue~~`: string, Work with `onSearch` to make search value controlled Deprecated.
- `showCheckedStrategy`: `TreeSelect.SHOW_ALL` | `TreeSelect.SHOW_PARENT` | `TreeSelect.SHOW_CHILD`, The way show selected item in box when `treeCheckable` set. **Default:** just show child nodes. **`TreeSelect.SHOW_ALL`:** show all checked treeNodes (include parent treeNode). **`TreeSelect.SHOW_PARENT`:** show checked treeNodes (just show parent treeNode). Default `TreeSelect.SHOW_CHILD`.
- `showSearch`: boolean | [Object](#showsearch), Support search or not. Default single: false | multiple: true.
- `size`: `large` | `middle` | `small`, To set the size of the select input.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `suffixIcon`: ReactNode, The custom suffix icon. Default `<DownOutlined />`.
- `switcherIcon`: ReactNode | ((props: AntTreeNodeProps) => ReactNode), Customize collapse/expand icon of tree node. Version renderProps: 4.20.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `tagRender`: (props) => ReactNode, Customize tag render when `multiple`.
- `treeCheckable`: boolean, Whether to show checkbox on the treeNodes. Default false.
- `treeCheckStrictly`: boolean, Whether to check nodes precisely (in the `checkable` mode), means parent and child nodes are not associated, and it will make `labelInValue` be true. Default false.
- `treeData`: array&lt;{ value, title, children, \[disabled, disableCheckbox, selectable, checkable] }>, Data of the treeNodes, manual construction work is no longer needed if this property has been set(ensure the Uniqueness of each value). Default \[].
- `treeDataSimpleMode`: boolean | object&lt;{ id: string, pId: string, rootPId: string }>, Enable simple mode of treeData. Changes the `treeData` schema to: \[{id:1, pId:0, value:'1', title:"test1",...},...] where pId is parent node's id). It is possible to replace the default `id` and `pId` keys by providing object to `treeDataSimpleMode`. Default false.
- `treeTitleRender`: (nodeData) => ReactNode, Customize tree node title render. Version 5.12.0.
- `tree. DefaultExpandAll`: boolean, false.
- `tree. DefaultExpandedKeys`: string\[], .
- `treeExpandAction`: string | boolean, Tree title open logic when click, optional: false | `click` | `doubleClick`. Default false. Version 4.21.0.
- `treeExpandedKeys`: string\[], Set expanded keys.
- `treeIcon`: boolean, Shows the icon before a TreeNode's title. There is no default style; you must set a custom style for it if set to `true`. Default false.
- `treeLine`: boolean | object, Show the line. Ref [Tree - showLine](/components/tree/#tree-demo-line). Default false. Version 4.17.0.
- `treeLoadedKeys`: string[], (Controlled) Set loaded tree nodes, work with `loadData` only. Default [].
- `~~treeNodeFilterProp~~`: string, Will be used for filtering if `filterTreeNode` returns true. Default `value`.
- `treeNodeLabelProp`: string, Will render as content of select. Default `title`.
- `value`: string | string\[], To set the current selected treeNode(s).
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of selector. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `virtual`: boolean, Disable virtual scroll when set to false. Default true. Version 4.1.0.
- `onChange`: function(value, label, extra), A callback function, can be executed when selected treeNodes or input value change.
- `~~onDropdownVisibleChange~~`: function(open), Called when dropdown open, use `onOpenChange` instead.
- `onOpenChange`: (open: boolean) => void, .
- `~~onSearch~~`: function(value: string), A callback function, can be executed when the search input changes Deprecated.
- `onSelect`: function(value, node, extra), A callback function, can be executed when you select a treeNode.
- `onTreeExpand`: function(expandedKeys), A callback function, can be executed when treeNode expanded.
- `onPopupScroll`: (event: UIEvent) => void, Called when dropdown scrolls. Version 5.17.0.

### showSearch Props

#### Required

- No required properties.

#### Optional

- `autoClearSearchValue`: boolean, If auto clear search input value when multiple select is selected/deselected. Default true.
- `filterTreeNode`: boolean | function(inputValue: string, treeNode: TreeNode) (should return boolean), Whether to filter treeNodes by input value. The value of `treeNodeFilterProp` is used for filtering by default. Default function.
- `searchValue`: string, Work with `onSearch` to make search value controlled.
- `treeNodeFilterProp`: string, Will be used for filtering if `filterTreeNode` returns true. Default `value`.
- `onSearch`: function(value: string), A callback function, can be executed when the search input changes.

### TreeNode props

#### Required

- No required properties.

#### Optional

- `checkable`: boolean, When Tree is checkable, set TreeNode display Checkbox or not.
- `disableCheckbox`: boolean, Disables the checkbox of the treeNode. Default false.
- `disabled`: boolean, Disabled or not. Default false.
- `isLeaf`: boolean, Leaf node or not. Default false.
- `key`: string, Required property (unless using `treeDataSimpleMode`), should be unique in the tree.
- `selectable`: boolean, Whether can be selected. Default true.
- `title`: ReactNode, Content showed on the treeNodes. Default `---`.
- `value`: string, Will be treated as `treeNodeFilterProp` by default, should be unique in the tree.

## Methods

- `blur()`:
- `focus()`:

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

const treeData = [
  {
    value: 'parent1', title: 'Parent 1', children: [
      {
        value: 'child1-1', title: 'Child 1-1', children: [
          { value: 'leaf1-1-1', title: 'Leaf 1-1-1' }, { value: 'leaf1-1-2', title: 'Leaf 1-1-2' }, ], }, {
        value: 'child1-2', title: 'Child 1-2', children: [{ value: 'leaf1-2-1', title: 'Leaf 1-2-1' }], }, ], }, {
    value: 'parent2', title: 'Parent 2', children: [{ value: 'child2-1', title: 'Child 2-1' }], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<string>();

  return (
    <TreeSelect
      style={{ width: '100%' }}
      value={value}
      placeholder="Text"
      tree. DefaultExpandAll
      onChange={setValue}
      treeData={treeData}
    />
  );
};
```

### Scenario 2: Multiple Selection

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

const treeData = [
  {
    value: 'parent1', title: 'Parent 1', children: [
      { value: 'child1-1', title: 'Child 1-1' }, { value: 'child1-2', title: 'Child 1-2' }, ], }, {
    value: 'parent2', title: 'Parent 2', children: [{ value: 'child2-1', title: 'Child 2-1' }], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<string[]>([]);

  return (
    <>
      <TreeSelect
        multiple
        style={{ width: '100%' }}
        value={value}
        placeholder="Text"
        tree. DefaultExpandAll
        onChange={setValue}
        treeData={treeData}
      />

      <TreeSelect
        treeCheckable
        style={{ width: '100%' }}
        placeholder="Text"
        tree. DefaultExpandAll
        onChange={console.log}
        treeData={treeData}
      />

      <TreeSelect
        multiple
        treeCheckable
        showCheckedStrategy="SHOW_PARENT"
        placeholder="Text(Text)"
        tree. DefaultExpandAll
        onChange={console.log}
        treeData={treeData}
      />
    </>
  );
};
```

### Scenario 3: Generate from tree data

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

const treeData = [
  {
    value: 'zhejiang', title: 'Zhejiang', children: [
      { value: 'hangzhou', title: 'Hangzhou' }, { value: 'ningbo', title: 'Ningbo' }, ], }, {
    value: 'jiangsu', title: 'Jiangsu', children: [{ value: 'nanjing', title: 'Nanjing' }], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<string>();
  const [searchValue, setSearchValue] = useState<string>();

  return (
    <>
      <TreeSelect
        showSearch
        style={{ width: '100%' }}
        value={value}
        placeholder="Search"
        tree. DefaultExpandAll
        onChange={setValue}
        treeData={treeData}
      />

      <TreeSelect
        showSearch
        style={{ width: '100%' }}
        value={value}
        searchValue={searchValue}
        placeholder="TextSearch"
        tree. DefaultExpandAll
        onChange={setValue}
        onSearch={setSearchValue}
        filterTreeNode={(inputValue, treeNode) =>
          treeNode.title.toLowerCase().includes(inputValue.toLowerCase())
        }
        treeData={treeData}
      />
    </>
  );
};
```

### Scenario 4: Checkable

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

interface DataNode {
  value: string;
  title: string;
  children?: DataNode[];
  isLeaf?: boolean;
}

const App: React.FC = () => {
  const [treeData, setTreeData] = useState<DataNode[]>([
    { value: 'parent1', title: 'Parent 1', isLeaf: false }, { value: 'parent2', title: 'Parent 2', isLeaf: false }, ]);

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const onLoadData = (node: DataNode) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        node.children = [
          {
            value: `${node.value}-1`, title: `${node.title} - Child 1`, isLeaf: true, }, {
            value: `${node.value}-2`, title: `${node.title} - Child 2`, isLeaf: true, }, ];
        setTreeData([.treeData]);
        resolve();
      }, 1000);
    });
  };

  return (
    <TreeSelect
      style={{ width: '100%' }}
      placeholder="Text"
      treeExpandedKeys={expandedKeys}
      onTreeExpand={setExpandedKeys}
      loadData={onLoadData}
      treeData={treeData}
    />
  );
};
```

### Scenario 5: Asynchronous loading

```tsx
import { TreeSelect } from 'antd';

const treeData = [
  {
    value: 'parent1', title: 'Parent 1', children: [
      { value: 'child1-1', title: 'Child 1-1' }, { value: 'child1-2', title: 'Child 1-2', disabled: true }, // Text
    ], }, {
    value: 'parent2', title: 'Parent 2', disabled: true, // Text
    children: [{ value: 'child2-1', title: 'Child 2-1' }], }, ];

const App: React.FC = () => (
  <>
    <TreeSelect disabled style={{ width: '100%' }} placeholder="Text" treeData={treeData} />

    <TreeSelect
      style={{ width: '100%' }}
      placeholder="Text"
      tree. DefaultExpandAll
      treeData={treeData}
    />

    <TreeSelect
      labelInValue
      style={{ width: '100%' }}
      placeholder="Text"
      tree. DefaultExpandAll
      onChange={(value) => {
        console.log('value:', value);
      }}
      treeData={treeData}
    />
  </>
);
```

### Scenario 6: Show Tree Line

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

interface Node {
  id: string;
  name: string;
  sub?: Node[];
}

const treeData = [
  {
    id: 'parent1', name: 'Parent 1', sub: [
      { id: 'child1-1', name: 'Child 1-1' }, { id: 'child1-2', name: 'Child 1-2' }, ], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<string>();

  return (
    <>
      <TreeSelect
        virtual
        listHeight={300}
        style={{ width: '100%' }}
        value={value}
        placeholder="Text"
        tree. DefaultExpandAll
        onChange={setValue}
        treeData={Array.from({ length: 100 }).map((_, i) => ({
          value: i.toString(), title: `Item ${i}`, }))}
      />

      <TreeSelect
        fieldNames={{ label: 'name', value: 'id', children: 'sub' }}
        style={{ width: '100%' }}
        placeholder="Text"
        tree. DefaultExpandAll
        onChange={setValue}
        treeData={treeData}
      />

      <TreeSelect
        readOnly
        style={{ width: '100%' }}
        defaultValue="child1-1"
        placeholder="Text"
        tree. DefaultExpandAll
        treeData={treeData}
      />
    </>
  );
};
```

## Usage Recommendations

Use TreeSelect to tree selection control.

## Example Code

```tsx
import { useState } from 'react';
import { TreeSelect } from 'antd';

const treeData = [
  {
    value: 'parent 1', title: 'parent 1', children: [
      {
        value: 'parent 1-0', title: 'parent 1-0', children: [
          { value: 'leaf1', title: 'leaf1' }, { value: 'leaf2', title: 'leaf2' }, ], }, {
        value: 'parent 1-1', title: 'parent 1-1', children: [{ value: 'leaf3', title: 'leaf3' }], }, ], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<string>();

  return (
    <>
      <TreeSelect
        showSearch
        style={{ width: '100%' }}
        value={value}
        placeholder="Please select"
        tree. DefaultExpandAll
        onChange={setValue}
        treeData={treeData}
      />

      <TreeSelect
        treeData={treeData}
        treeCheckable
        showCheckedStrategy="SHOW_PARENT"
        placeholder="Please select"
        style={{ width: '100%' }}
      />
    </>
  );
};
```

## Result

Renders a TreeSelect component.

## References
- Component docs: `https://ant.design/components/tree-select` — use for API details, defaults, and official examples.