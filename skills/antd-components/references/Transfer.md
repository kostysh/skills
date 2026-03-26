# Transfer — Double column transfer choice box.

## Overview

Double column transfer choice box.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- It is a select control essentially which can be use for selecting multiple items.
- Transfer can display more information for items and take up more space.
## Input Fields

### Transfer Props

#### Required

- No required properties.

#### Optional

- `actions`: ReactNode\[], A set of operations that are sorted from top to bottom. When an array of strings is provided, default buttons will be used; when an array of ReactNode is provided, custom elements will be used. Default \[`>`, `<`]. Version 6.0.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dataSource`: [RecordType extends TransferItem = TransferItem](https://github.com/ant-design/ant-design/blob/1bf0bab2a7bc0a774119f501806e3e0e3a6ba283/components/transfer/index.tsx#L12)\[], Used for setting the source data. The elements that are part of this array will be present the left column. Except the elements whose keys are included in `targetKeys` prop. Default \[].
- `disabled`: boolean, Whether disabled transfer. Default false.
- `selectionsIcon`: React.ReactNode, custom dropdown icon. Version 5.8.0.
- `filterOption`: (inputValue, option, direction: `left` | `right`): boolean, A function to determine whether an item should show in search result list, only works when searching, (add `direction` support since 5.9.0+).
- `footer`: (props, { direction }) => ReactNode, A function used for rendering the footer. Version direction: 4.17.0.
- `~~listStyle~~`: object | ({direction: `left` | `right`}) => object, A custom CSS style used for rendering the transfer columns. Use `styles.section` instead.
- `locale`: { itemUnit: string; itemsUnit: string; searchPlaceholder: string; notFoundContent: ReactNode | ReactNode[]; }, The i18n text including filter, empty text, item unit, etc. Default { itemUnit: `item`, itemsUnit: `items`, notFoundContent: `The list is empty`, searchPlaceholder: `Search here` }.
- `oneWay`: boolean, Display as single direction style. Default false. Version 4.3.0.
- `~~operations~~`: string\[], A set of operations that are sorted from top to bottom. Use `actions` instead. Default \[`>`, `<`].
- `~~operationStyle~~`: object, A custom CSS style used for rendering the operations column. Use `styles.actions` instead.
- `pagination`: boolean | { pageSize: number, simple: boolean, showSizeChanger?: boolean, showLessItems?: boolean }, Use pagination. Not work in render props. Default false. Version 4.3.0.
- `render`: (record) => ReactNode, The function to generate the item shown on a column. Based on an record (element of the dataSource array), this function should return a React element which is generated from that record. Also, it can return a plain object with `value` and `label`, `label` is a React element and `value` is for title.
- `selectAllLabels`: (ReactNode | (info: { selectedCount: number, totalCount: number }) => ReactNode)\[], A set of customized labels for select all checkboxes on the header.
- `selectedKeys`: string\[] | number\[], A set of keys of selected items. Default \[].
- `showSearch`: boolean | { placeholder:string,defaultValue:string }, If included, a search box is shown on each column. Default false.
- `showSelectAll`: boolean, Show select all checkbox on the header. Default true.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `targetKeys`: string\[] | number\[], A set of keys of elements that are listed on the right column. Default \[].
- `titles`: ReactNode\[], A set of titles that are sorted from left to right.
- `onChange`: (targetKeys, direction, moveKeys): void, A callback function that is executed when the transfer between columns is complete.
- `onScroll`: (direction, event): void, A callback function which is executed when scroll options list.
- `onSearch`: (direction: `left` | `right`, value: string): void, A callback function which is executed when search field are changed.
- `onSelectChange`: (sourceSelectedKeys, targetSelectedKeys): void, A callback function which is executed when selected items are changed.

### children Props

#### Required

- No required properties.

#### Optional

- `direction`: `left` | `right`, .
- `disabled`: boolean, Whether disabled transfer. Default false.
- `filteredItems`: RecordType\[], .
- `selectedKeys`: string\[] | number\[], A set of keys of selected items. Default \[].
- `onItemSelect`: (key: string | number, selected: boolean), .
- `onItemSelectAll`: (keys: string\[] | number\[], selected: boolean), .

## Methods

No public methods.

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { useState } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd';

interface RecordType {
  key: string;
  title: string;
  description: string;
}

const mockData: RecordType[] = Array.from({ length: 20 }).map((_, i) => ({
  key: i.toString(), title: `content${i + 1}`, description: `description of content${i + 1}`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>(['1', '3']);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <Transfer
      dataSource={mockData}
      titles={['Available', 'Selected']}
      targetKeys={targetKeys}
      onChange={onChange}
      render={(item) => item.title}
    />
  );
};
```

### Scenario 2: One Way

```tsx
import { useState } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd';

interface Item {
  key: string;
  title: string;
  description: string;
}

const mockData: Item[] = Array.from({ length: 30 }).map((_, i) => ({
  key: i.toString(), title: `User ${i + 1}`, description: `User ${i + 1} description`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange: TransferProps['onSelectChange'] = (
    sourceSelectedKeys, targetSelectedKeys, ) => {
    setSelectedKeys([.sourceSelectedKeys, .targetSelectedKeys]);
  };

  const filterOption = (inputValue: string, option: any) => {
    return option.title.toLowerCase().includes(inputValue.toLowerCase());
  };

  return (
    <Transfer
      dataSource={mockData}
      titles={['Source', 'Target']}
      targetKeys={targetKeys}
      selectedKeys={selectedKeys}
      onChange={onChange}
      onSelectChange={onSelectChange}
      filterOption={filterOption}
      render={(item) => item.title}
      showSearch
    />
  );
};
```

### Scenario 3: Search

```tsx
import { useState } from 'react';
import { Button, Space, Transfer } from 'antd';
import type { TransferProps } from 'antd';

const mockData = Array.from({ length: 15 }).map((_, i) => ({
  key: i.toString(), title: `Item ${i + 1}`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  const selectAll = () => {
    setTargetKeys(mockData.map((item) => item.key));
  };

  const clearAll = () => {
    setTargetKeys([]);
  };

  const reverse = () => {
    const newKeys = mockData
      .filter((item) => !targetKeys.includes(item.key))
      .map((item) => item.key);
    setTargetKeys(newKeys);
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={selectAll}>Text</Button>
        <Button onClick={clearAll}>Text</Button>
        <Button onClick={reverse}>Text</Button>
      </Space>

      <Transfer
        dataSource={mockData}
        targetKeys={targetKeys}
        onChange={onChange}
        titles={['Source', 'Target']}
        render={(item) => item.title}
      />
    </>
  );
};
```

### Scenario 4: Advanced

```tsx
import { useState } from 'react';
import { Avatar, Transfer } from 'antd';
import type { TransferProps } from 'antd';

interface UserItem {
  key: string;
  title: string;
  avatar: string;
}

const mockUsers: UserItem[] = Array.from({ length: 10 }).map((_, i) => ({
  key: i.toString(), title: `User ${i + 1}`, avatar: `https://api.realworld.io/images/demo-avatar-${(i % 6) + 1}.jpg`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <Transfer
      dataSource={mockUsers}
      titles={['Available Users', 'Selected Users']}
      targetKeys={targetKeys}
      onChange={onChange}
      render={(item: UserItem) => (
        <span>
          <Avatar src={item.avatar} size="small" style={{ marginRight: 8 }} />
          {item.title}
        </span>
      )}
    />
  );
};
```

### Scenario 5: Custom datasource

```tsx
import { useState } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd';

const mockData = Array.from({ length: 100 }).map((_, i) => ({
  key: i.toString(), title: `Item ${i + 1}`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <Transfer
      dataSource={mockData}
      titles={['Source', 'Target']}
      targetKeys={targetKeys}
      onChange={onChange}
      render={(item) => item.title}
      pagination={{ pageSize: 5 }}
      showSearch
    />
  );
};
```

### Scenario 6: Pagination

```tsx
import { useState } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd';

const mockData = Array.from({ length: 10 }).map((_, i) => ({
  key: i.toString(), title: `Item ${i + 1}`, }));

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <Transfer
      dataSource={mockData}
      titles={['Available', 'Selected']}
      targetKeys={targetKeys}
      onChange={onChange}
      render={(item) => item.title}
      oneWay={true} // Text:Text
      showSearch
    />
  );
};
```

## Usage Recommendations

Use Transfer to double column transfer choice box.

## Example Code

```tsx
import { useState } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd';

interface RecordType {
  key: string;
  title: string;
  description: string;
}

const mockData: RecordType[] = Array.from({ length: 20 }).map((_, i) => ({
  key: i.toString(), title: `content${i + 1}`, description: `description of content${i + 1}`, }));

const initialTargetKeys = mockData.filter((item) => Number(item.key) > 10).map((item) => item.key);

const App: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>(initialTargetKeys);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const onChange: TransferProps['onChange'] = (nextTargetKeys, direction, moveKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange: TransferProps['onSelectChange'] = (
    sourceSelectedKeys, targetSelectedKeys, ) => {
    setSelectedKeys([.sourceSelectedKeys, .targetSelectedKeys]);
  };

  return (
    <Transfer
      dataSource={mockData}
      titles={['Source', 'Target']}
      targetKeys={targetKeys}
      selectedKeys={selectedKeys}
      onChange={onChange}
      onSelectChange={onSelectChange}
      render={(item) => item.title}
      showSearch
    />
  );
};
```

## Result

Renders a Transfer component.

## References
- Component docs: `https://ant.design/components/transfer` — use for API details, defaults, and official examples.