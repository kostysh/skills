# Tree — Multiple-level structure list.

## Overview

Multiple-level structure list.

## When To Use

- Almost anything can be represented in a tree structure. Examples include directories, organization hierarchies, biological classifications, countries, etc. The `Tree` component is a way of representing the hierarchical relationship between these things. You can also expand, collapse, and select a treeNode within a `Tree`.
## Input Fields

### Tree props

#### Required

- No required properties.

#### Optional

- `allowDrop`: ({ dropNode, dropPosition }) => boolean, Whether to allow dropping on the node.
- `autoExpandParent`: boolean, Whether to automatically expand a parent treeNode. Default false.
- `blockNode`: boolean, Whether treeNode fill remaining horizontal space. Default false.
- `checkable`: boolean, Add a Checkbox before the treeNodes. Default false.
- `checkedKeys`: string\[] | {checked: string\[], halfChecked: string\[]}, (Controlled) Specifies the keys of the checked treeNodes (PS: When this specifies the key of a treeNode which is also a parent treeNode, all the children treeNodes of will be checked; and vice versa, when it specifies the key of a treeNode which is a child treeNode, its parent treeNode will also be checked. When `checkable` and `checkStrictly` is true, its object has `checked` and `halfChecked` property. Regardless of whether the child or parent treeNode is checked, they won't impact each other. Default \[].
- `checkStrictly`: boolean, Check treeNode precisely; parent treeNode and children treeNodes are not associated. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultCheckedKeys`: string\[], Specifies the keys of the default checked treeNodes. Default \[].
- `defaultExpandAll`: boolean, Whether to expand all treeNodes by default. Default false.
- `defaultExpandedKeys`: string\[], Specify the keys of the default expanded treeNodes. Default \[].
- `defaultExpandParent`: boolean, If auto expand parent treeNodes when init. Default true.
- `defaultSelectedKeys`: string\[], Specifies the keys of the default selected treeNodes. Default \[].
- `disabled`: boolean, Whether the tree is disabled. Default false.
- `draggable`: boolean | ((node: DataNode) => boolean) | { icon?: React.ReactNode | false, nodeDraggable?: (node: DataNode) => boolean }, Specifies whether this Tree or the node is draggable. Use `icon: false` to disable drag handler icon. Default false. Version `config`: 4.17.0.
- `expandedKeys`: string\[], (Controlled) Specifies the keys of the expanded treeNodes. Default \[].
- `fieldNames`: object, Customize node title, key, children field name. Default { title: `title`, key: `key`, children: `children` }. Version 4.17.0.
- `filterTreeNode`: function(node), Defines a function to filter (highlight) treeNodes. When the function returns `true`, the corresponding treeNode will be highlighted.
- `height`: number, Config virtual scroll height. Will not support horizontal scroll when enabled.
- `icon`: ReactNode | (props) => ReactNode, Insert a custom icon before the title. Need to set `showIcon` to true.
- `loadData`: function(node), Load data asynchronously.
- `loadedKeys`: string\[], (Controlled) Set loaded tree nodes. Need to work with `loadData`. Default \[].
- `multiple`: boolean, Allows selecting multiple treeNodes. Default false.
- `rootStyle`: CSSProperties, Style on the root element. Version 4.20.0.
- `selectable`: boolean, Whether it can be selected. Default true.
- `selectedKeys`: string\[], (Controlled) Specifies the keys of the selected treeNodes, multiple selection needs to set `multiple` to true.
- `showIcon`: boolean, Controls whether to display the `icon` node (no default style). Default false.
- `showLine`: boolean | {showLeafIcon: ReactNode | ((props: AntTreeNodeProps) => ReactNode)}, Shows a connecting line. Default false.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `switcherIcon`: ReactNode | ((props: AntTreeNodeProps) => ReactNode), Customize expand/collapse icons for tree nodes (With default rotate angular style). Version renderProps: 4.20.0.
- `switcherLoadingIcon`: ReactNode, Customize loading icons for tree nodes. Version 5.20.0.
- `titleRender`: (nodeData) => ReactNode, Customize tree node title render. Version 4.5.0.
- `treeData`: array&lt;{ key, title, children, \[disabled, selectable] }>, The treeNodes data Array, if set it then you need not to construct children TreeNode. (key should be unique across the whole array).
- `virtual`: boolean, Disable virtual scroll when set to false. Default true. Version 4.1.0.
- `onCheck`: function(checkedKeys, e:{checked: boolean, checkedNodes, node, event, halfCheckedKeys}), Callback function for when the onCheck event occurs.
- `onDragEnd`: function({event, node}), Callback function for when the onDragEnd event occurs.
- `onDragEnter`: function({event, node, expandedKeys}), Callback function for when the onDragEnter event occurs.
- `onDragLeave`: function({event, node}), Callback function for when the onDragLeave event occurs.
- `onDragOver`: function({event, node}), Callback function for when the onDragOver event occurs.
- `onDragStart`: function({event, node}), Callback function for when the onDragStart event occurs.
- `onDrop`: function({event, node, dragNode, dragNodesKeys}), Callback function for when the onDrop event occurs.
- `onExpand`: function(expandedKeys, {expanded: boolean, node}), Callback function for when a treeNode is expanded or collapsed.
- `onLoad`: function(loadedKeys, {event, node}), Callback function for when a treeNode is loaded.
- `onRightClick`: function({event, node}), Callback function for when the user right clicks a treeNode.
- `onSelect`: function(selectedKeys, e:{selected: boolean, selectedNodes, node, event}), Callback function for when the user clicks a treeNode.

### TreeNode props

#### Required

- No required properties.

#### Optional

- `checkable`: boolean, When Tree is checkable, set TreeNode display Checkbox or not.
- `disableCheckbox`: boolean, Disables the checkbox of the treeNode. Default false.
- `disabled`: boolean, Disables the treeNode. Default false.
- `icon`: ReactNode | (props) => ReactNode, Customize icon. When you pass component, whose render will receive full TreeNode props as component props.
- `isLeaf`: boolean, Determines if this is a leaf node (effective when `loadData` is specified). `false` will force the TreeNode to be treated as a parent node.
- `key`: string, Used with (default)ExpandedKeys / (default)CheckedKeys / (default)SelectedKeys. P.S.: It must be unique in all of treeNodes of the tree. Default (internal calculated position of treeNode).
- `selectable`: boolean, Set whether the treeNode can be selected. Default true.
- `title`: ReactNode, Title. Default `---`.

### DirectoryTree props

#### Required

- No required properties.

#### Optional

- `expandAction`: string | boolean, Directory opening logic, options: false | `click` | `doubleClick`. Default `click`.

## Methods

- `scrollTo({ key: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number })`:, key

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'parent 1', key: '0-0', children: [
      {
        title: 'parent 1-0', key: '0-0-0', children: [
          { title: 'leaf 0-0-0-0', key: '0-0-0-0' }, { title: 'leaf 0-0-0-1', key: '0-0-0-1' }, ], }, { title: 'parent 1-1', key: '0-0-1' }, ], }, ];

const App: React.FC = () => {
  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
  };

  return (
    <Tree
      defaultExpandedKeys={['0-0-0']}
      defaultSelectedKeys={['0-0-0']}
      onSelect={onSelect}
      treeData={treeData}
    />
  );
};
```

### Scenario 2: Controlled Tree

```tsx
import { useState } from 'react';
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'Text', key: 'root', children: [
      {
        title: 'Text', key: 'beijing', children: [
          { title: 'Text', key: 'chaoyang' }, { title: 'Text', key: 'haidian' }, ], }, { title: 'Text', key: 'shanghai' }, ], }, ];

const App: React.FC = () => {
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(['chaoyang']);

  const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
    console.log('onCheck', checkedKeys, info);
    setCheckedKeys(checkedKeys as React.Key[]);
  };

  return (
    <>
      <Tree
        checkable
        defaultExpandedKeys={['root', 'beijing']}
        checkedKeys={checkedKeys}
        onCheck={onCheck}
        treeData={treeData}
      />
      <p>Text: {checkedKeys.join(', ')}</p>
    </>
  );
};
```

### Scenario 3: draggable

```tsx
import { useState } from 'react';
import { Button, Space, Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'Parent 1', key: '0-0', children: [
      { title: 'Child 1-0', key: '0-0-0' }, { title: 'Child 1-1', key: '0-0-1' }, ], }, ];

const App: React.FC = () => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['0-0']);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setExpandedKeys(['0-0'])}>Text</Button>
        <Button onClick={() => setExpandedKeys([])}>Text</Button>
      </Space>
      <Tree
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={setExpandedKeys}
        onSelect={setSelectedKeys}
        treeData={treeData}
      />
    </>
  );
};
```

### Scenario 4: load data asynchronously

```tsx
import { useState } from 'react';
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const App: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeDataNode[]>([{ title: 'Expand to load', key: '0' }]);

  const onLoadData: TreeProps['loadData'] = ({ key, children }) => {
    return new Promise((resolve) => {
      if (children) {
        resolve();
        return;
      }
      setTimeout(() => {
        setTreeData((origin) =>
          origin.map((node) => {
            if (node.key === key) {
              return {
                .node, children: [
                  { title: `Child ${key}-0`, key: `${key}-0` }, { title: `Child ${key}-1`, key: `${key}-1` }, ], };
            }
            return node;
          }), );
        resolve();
      }, 1000);
    });
  };

  return <Tree loadData={onLoadData} treeData={treeData} />;
};
```

### Scenario 5: Searchable

```tsx
import { useState } from 'react';
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'Item 1', key: '0-0', children: [
      { title: 'Item 1-1', key: '0-0-0' }, { title: 'Item 1-2', key: '0-0-1' }, ], }, ];

const App: React.FC = () => {
  const [data, setData] = useState(treeData);

  const onDrop: TreeProps['onDrop'] = (info) => {
    console.log('Drop info:', info);
  };

  return <Tree draggable blockNode treeData={data} onDrop={onDrop} />;
};
```

### Scenario 6: Tree with line

```tsx
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'src', key: 'src', children: [
      {
        title: 'components', key: 'components', children: [
          { title: 'Button.tsx', key: 'button' }, { title: 'Input.tsx', key: 'input' }, ], }, { title: 'utils', key: 'utils' }, ], }, ];

const App: React.FC = () => {
  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('Selected:', selectedKeys);
  };

  return (
    <Tree.DirectoryTree
      defaultExpandedKeys={['src', 'components']}
      onSelect={onSelect}
      treeData={treeData}
    />
  );
};
```

## Usage Recommendations

Use Tree to multiple-level structure list.

## Example Code

```tsx
import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';

const treeData: TreeDataNode[] = [
  {
    title: 'parent 1', key: '0-0', children: [
      {
        title: 'parent 1-0', key: '0-0-0', children: [
          { title: 'leaf', key: '0-0-0-0' }, { title: 'leaf', key: '0-0-0-1' }, ], }, {
        title: 'parent 1-1', key: '0-0-1', children: [{ title: 'leaf', key: '0-0-1-0' }], }, ], }, ];

const App: React.FC = () => {
  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
  };

  const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
    console.log('onCheck', checkedKeys, info);
  };

  return (
    <Tree
      checkable
      defaultExpandedKeys={['0-0-0']}
      defaultSelectedKeys={['0-0-0']}
      defaultCheckedKeys={['0-0-0']}
      onSelect={onSelect}
      onCheck={onCheck}
      treeData={treeData}
    />
  );
};
```

## Result

Renders a Tree component.

## References
- Component docs: `https://ant.design/components/tree` — use for API details, defaults, and official examples.