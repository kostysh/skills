# Cascader — Cascade selection box.

## Overview

Cascade selection box.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When you need to select from a set of associated data set. Such as province/city/district, company level, things classification.
- When selecting from a large data set, with multi-stage classifications separated for easy selection.
- Chooses cascade items in one float layer for better user experience.
## Input Fields

### Cascader Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Show clear button. Default true. Version 5.8.0: Support object type.
- `~~autoClearSearchValue~~`: boolean, Whether the current search will be cleared on selecting an item. Only applies when `multiple` is `true`. Default true. Version 5.9.0 Deprecated.
- `changeOnSelect`: boolean, Change value on each selection if set to true, see above demo for details. Default false.
- `className`: string, The additional css class.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultOpen`: boolean, Initial visible of cascader popup.
- `defaultValue`: string\[] | number\[], Initial selected value. Default \[].
- `disabled`: boolean, Whether disabled select. Default false.
- `displayRender`: (label, selectedOptions) => ReactNode, The render function of displaying selected options. Default label => label.join(`/`). Version `multiple`: 4.18.0.
- `tagRender`: (label: string, onClose: function, value: string) => ReactNode, Custom render function for tags in `multiple` mode.
- `~~popupClassName~~`: string, The additional className of popup overlay, use `classNames.popup.root` instead. Version 4.23.0.
- `~~dropdownRender~~`: (menus: ReactNode) => ReactNode, Customize dropdown content, use `popupRender` instead. Version 4.4.0.
- `popupRender`: (menus: ReactNode) => ReactNode, Customize dropdown content.
- `~~dropdownStyle~~`: CSSProperties, The style of dropdown menu, use `styles.popup.root` instead.
- `expandIcon`: ReactNode, Customize the current item expand icon. Version 4.4.0.
- `expandTrigger`: string, expand current item when click or hover, one of `click` `hover`. Default `click`.
- `fieldNames`: object, Custom field name for label and value and children. Default { label: `label`, value: `value`, children: `children` }.
- `getPopupContainer`: function(triggerNode), Parent Node which the selector should be rendered to. Default to `body`. When position issues happen, try to modify it into scrollable content and position it relative. [example](https://codepen.io/afc163/pen/zEjNOy?editors=0010). Default () => document.body.
- `loadData`: (selectedOptions) => void, To load option lazily, and it cannot work with `showSearch`.
- `maxTagCount`: number | `responsive`, Max tag count to show. `responsive` will cost render performance. Version 4.17.0.
- `maxTagPlaceholder`: ReactNode | function(omittedValues), Placeholder for not showing tags. Version 4.17.0.
- `maxTagTextLength`: number, Max tag text length to show. Version 4.17.0.
- `notFoundContent`: ReactNode, Specify content to show when no result matches. Default `Not Found`.
- `open`: boolean, Set visible of cascader popup. Version 4.17.0.
- `options`: [Option](#option)\[], The data options of cascade.
- `placeholder`: string, The input placeholder.
- `placement`: `bottomLeft` `bottomRight` `topLeft` `topRight`, Use preset popup align config from builtinPlacements. Default `bottomLeft`. Version 4.17.0.
- `prefix`: ReactNode, The custom prefix. Version 5.22.0.
- `showSearch`: boolean | [Object](#showsearch), Whether show search input in single mode. Default false.
- `size`: `large` | `middle` | `small`, The input size.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `suffixIcon`: ReactNode, The custom suffix icon.
- `value`: string\[] | number\[], The selected value.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of selector. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `onChange`: (value, selectedOptions) => void, Callback when finishing cascader select.
- `~~onDropdownVisibleChange~~`: (value) => void, Callback when popup shown or hidden, use `onOpenChange` instead. Version 4.17.0.
- `onOpenChange`: (value) => void, Callback when popup shown or hidden.
- `multiple`: boolean, Support multiple or not. Version 4.17.0.
- `showCheckedStrategy`: `Cascader.SHOW_PARENT` | `Cascader.SHOW_CHILD`, The way to show selected items in the box (only effective when `multiple` is `true`). `Cascader.SHOW_CHILD`: just show child treeNode. `Cascader.SHOW_PARENT`: just show parent treeNode (when all child treeNode under the parent treeNode are checked). Default `Cascader.SHOW_PARENT`. Version 4.20.0.
- `removeIcon`: ReactNode, The custom remove icon.
- `~searchValue~`: string, `showSearch`, Version 4.17.0.
- `~onSearch~`: (search: string) => void,   Version 4.17.0.
- `~~dropdownMenuColumnStyle~~`: CSSProperties, The style of the drop-down menu column, use `popupMenuColumnStyle` instead.
- `popupMenuColumnStyle`: CSSProperties, The style of the drop-down menu column.
- `optionRender`: (option: Option) => React.ReactNode, Customize the rendering dropdown options. Version 5.16.0.

### showSearch Props

#### Required

- No required properties.

#### Optional

- `autoClearSearchValue`: boolean, Whether the current search will be cleared on selecting an item. Only applies when `multiple` is `true`. Default true. Version 5.9.0.
- `filter`: function(inputValue, path): boolean, The function will receive two arguments, inputValue and option, if the function returns true, the option will be included in the filtered set; Otherwise, it will be excluded.
- `limit`: number | false, Set the count of filtered items. Default 50.
- `matchInputWidth`: boolean, Whether the width of list matches input, ([how it looks](https://github.com/ant-design/ant-design/issues/25779)). Default true.
- `render`: function(inputValue, path): ReactNode, Used to render filtered options.
- `sort`: function(a, b, inputValue), Used to sort filtered options.
- `searchValue`: string, Set search value, Need work with `showSearch`. Version 4.17.0.
- `onSearch`: (search: string) => void, The callback function triggered when input changed. Version 4.17.0.

## Methods

- `blur()`:
- `focus()`:

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { Cascader } from 'antd';

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const options: Option[] = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [
          { value: 'xihu', label: 'West Lake' }, { value: 'shangcheng', label: 'Shangcheng' }, ], }, {
        value: 'ningbo', label: 'Ningbo', children: [{ value: 'jiangbei', label: 'Jiangbei' }], }, ], }, {
    value: 'jiangsu', label: 'Jiangsu', children: [
      {
        value: 'nanjing', label: 'Nanjing', children: [{ value: 'zhonghuamen', label: 'Zhong Hua Men' }], }, ], }, ];

const App: React.FC = () => (
  <Cascader
    options={options}
    onChange={(value, selectedOptions) => {
      console.log('Value:', value);
      console.log('SelectedOptions:', selectedOptions);
    }}
    placeholder="Text"
  />
);
```

### Scenario 2: Default value

```tsx
import { useState } from 'react';
import { Button, Cascader, Space } from 'antd';

const options = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [{ value: 'xihu', label: 'West Lake' }], }, ], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<(string | number)[]>(['zhejiang', 'hangzhou', 'xihu']);

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setValue(['zhejiang', 'hangzhou', 'xihu'])}>Text</Button>
        <Button onClick={() => setValue([])}>Text</Button>
      </Space>

      <Cascader options={options} value={value} onChange={setValue} placeholder="Text" />
    </>
  );
};
```

### Scenario 3: Custom trigger

```tsx
import { Cascader } from 'antd';

const options = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [
          { value: 'xihu', label: 'West Lake' }, { value: 'shangcheng', label: 'Shangcheng' }, ], }, ], }, {
    value: 'jiangsu', label: 'Jiangsu', children: [
      {
        value: 'nanjing', label: 'Nanjing', children: [{ value: 'zhonghuamen', label: 'Zhong Hua Men' }], }, ], }, ];

const App: React.FC = () => (
  <>
    <Cascader options={options} showSearch placeholder="SearchText" />

    <Cascader
      options={options}
      showSearch={{
        filter: (inputValue, path) =>
          path.some((option) => option.label.toLowerCase().includes(inputValue.toLowerCase())), }}
      placeholder="TextSearch"
    />
  </>
);
```

### Scenario 4: Hover

```tsx
import { useState } from 'react';
import { Cascader } from 'antd';

interface Option {
  value: string;
  label: string;
  children?: Option[];
  isLeaf?: boolean;
}

const App: React.FC = () => {
  const [options, setOptions] = useState<Option[]>([
    {
      value: 'parent1', label: 'Parent 1', isLeaf: false, }, {
      value: 'parent2', label: 'Parent 2', isLeaf: false, }, ]);

  const onLoadData = (selectedOptions: Option[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];

    setTimeout(() => {
      targetOption.children = [
        {
          label: `${targetOption.label} - Child 1`, value: `${targetOption.value}-child1`, isLeaf: true, }, {
          label: `${targetOption.label} - Child 2`, value: `${targetOption.value}-child2`, isLeaf: true, }, ];
      setOptions([.options]);
    }, 1000);
  };

  return (
    <Cascader
      options={options}
      loadData={onLoadData}
      onChange={console.log}
      placeholder="Text"
    />
  );
};
```

### Scenario 5: Disabled option

```tsx
import { useState } from 'react';
import { Cascader } from 'antd';

const options = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [{ value: 'xihu', label: 'West Lake' }], }, ], }, {
    value: 'jiangsu', label: 'Jiangsu', disabled: true, // Text
    children: [
      {
        value: 'nanjing', label: 'Nanjing', children: [{ value: 'zhonghuamen', label: 'Zhong Hua Men' }], }, ], }, ];

const App: React.FC = () => {
  const [value, setValue] = useState<(string | number)[][]>([]);

  return (
    <>
      <Cascader
        options={options}
        value={value}
        onChange={setValue}
        multiple
        maxTagCount="responsive"
        placeholder="Text"
      />

      <Cascader options={options} onChange={console.log} disabled placeholder="Text" />

      <Cascader options={options} onChange={console.log} allowClear placeholder="Text" />
    </>
  );
};
```

### Scenario 6: Change on select

```tsx
import { Cascader } from 'antd';

const options = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [{ value: 'xihu', label: 'West Lake' }], }, ], }, ];

const App: React.FC = () => (
  <>
    <Cascader
      options={options}
      displayRender={(labels) => labels.join(' > ')}
      placeholder="Text"
    />

    <Cascader
      options={[
        {
          id: 'zhejiang', name: 'Zhejiang', sub: [
            {
              id: 'hangzhou', name: 'Hangzhou', sub: [{ id: 'xihu', name: 'West Lake' }], }, ], }, ]}
      fieldNames={{ label: 'name', value: 'id', children: 'sub' }}
      placeholder="Text"
    />

    <Cascader options={options} changeOnSelect placeholder="Text" />
  </>
);
```

## Usage Recommendations

Use Cascader to cascade selection box.

## Example Code

```tsx
import { Cascader } from 'antd';

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const options: Option[] = [
  {
    value: 'zhejiang', label: 'Zhejiang', children: [
      {
        value: 'hangzhou', label: 'Hangzhou', children: [{ value: 'xihu', label: 'West Lake' }], }, ], }, {
    value: 'jiangsu', label: 'Jiangsu', children: [
      {
        value: 'nanjing', label: 'Nanjing', children: [{ value: 'zhonghuamen', label: 'Zhong Hua Men' }], }, ], }, ];

const App: React.FC = () => (
  <>
    <Cascader
      options={options}
      onChange={(value, selectedOptions) => console.log(value, selectedOptions)}
      placeholder="Please select"
    />

    <Cascader options={options} showSearch placeholder="Search" />

    <Cascader options={options} multiple placeholder="Multiple" />
  </>
);
```

## Result

Renders a Cascader component.

## References
- Component docs: `https://ant.design/components/cascader` — use for API details, defaults, and official examples.