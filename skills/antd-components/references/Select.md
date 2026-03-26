# Select — A dropdown menu for displaying choices.

## Overview

A dropdown menu for displaying choices.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- A dropdown menu for displaying choices - an elegant alternative to the native `<select>` element.
- Utilizing [Radio](/components/radio/) is recommended when there are fewer total options (less than 5).
- You probably need [AutoComplete](/components/auto-complete/) if you're looking for an input box that can be typed or selected.
## Input Fields

### Select props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Customize clear icon. Default false. Version 5.8.0: Support object type.
- `~~autoClearSearchValue~~`: boolean, `mode`  `multiple`  `tags`, true Deprecated.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Select component. Supports object or function.
- `defaultActiveFirstOption`: boolean, Whether active first option by default. Default true.
- `defaultOpen`: boolean, Initial open state of dropdown.
- `defaultValue`: string | string\[] | <br />number | number\[] | <br />LabeledValue | LabeledValue\[], Initial selected option.
- `disabled`: boolean, Whether disabled select. Default false.
- `~~popupClassName~~`: string, The className of dropdown menu, use `classNames.popup.root` instead. Version 4.23.0.
- `popupMatchSelectWidth`: boolean | number, Determine whether the popup menu and the select input are the same width. Default set `min-width` same as input. Will ignore when value less than select width. `false` will disable virtual scroll. Default true. Version 5.5.0.
- `~~dropdownRender~~`: (originNode: ReactNode) => ReactNode, Customize dropdown content, use `popupRender` instead.
- `popupRender`: (originNode: ReactNode) => ReactNode, Customize dropdown content. Version 5.25.0.
- `~~dropdownStyle~~`: CSSProperties, The style of dropdown menu, use `styles.popup.root` instead.
- `fieldNames`: object, Customize node label, value, options，groupLabel field name. Default { label: `label`, value: `value`, options: `options`, groupLabel: `label` }. Version 4.17.0 (`groupLabel` added in 5.6.0).
- `~~filterOption~~`: boolean | function(inputValue, option), If true, filter options by input, if function, filter options against it. The function will receive two arguments, `inputValue` and `option`, if the function returns `true`, the option will be included in the filtered set; Otherwise, it will be excluded. Default true Deprecated.
- `~~filterSort~~`: (optionA: Option, optionB: Option, info: { searchValue: string }) => number, Sort function for search options sorting, see [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)'s compareFunction. Version `searchValue`: 5.19.0 Deprecated.
- `getPopupContainer`: function(triggerNode), Parent Node which the selector should be rendered to. Default to `body`. When position issues happen, try to modify it into scrollable content and position it relative. [Example](https://codesandbox.io/s/4j168r7jw0). Default () => document.body.
- `labelInValue`: boolean, Whether to embed label in value, turn the format of value from `string` to { value: string, label: ReactNode }. Default false.
- `listHeight`: number, Config popup height. Default 256.
- `loading`: boolean, Indicate loading state. Default false.
- `maxCount`: number, The max number of items can be selected, only applies when `mode` is `multiple` or `tags`. Version 5.13.0.
- `maxTagCount`: number | `responsive`, Max tag count to show. `responsive` will cost render performance. Version responsive: 4.10.
- `maxTagPlaceholder`: ReactNode | function(omittedValues), Placeholder for not showing tags.
- `maxTagTextLength`: number, Max tag text length to show.
- `menuItemSelectedIcon`: ReactNode, The custom menuItemSelected icon with multiple options.
- `mode`: `multiple` | `tags`, Set mode of Select.
- `notFoundContent`: ReactNode, Specify content to show when no result matches. Default `Not Found`.
- `open`: boolean, Controlled open state of dropdown.
- `~~optionFilterProp~~`: , Deprecated, see `showSearch.optionFilterProp` Deprecated.
- `optionLabelProp`: string, Which prop value of option will render as content of select. [Example](https://codesandbox.io/s/antd-reproduction-template-tk678). Default `children`.
- `options`: { label, value }\[], Select options. Will get better perf than jsx definition.
- `optionRender`: (option: FlattenOptionData\<BaseOptionType\> , info: { index: number }) => React.ReactNode, Customize the rendering dropdown options. Version 5.11.0.
- `placeholder`: ReactNode, Placeholder of select.
- `placement`: `bottomLeft` `bottomRight` `topLeft` `topRight`, The position where the selection box pops up. Default bottomLeft.
- `prefix`: ReactNode, The custom prefix. Version 5.22.0.
- `removeIcon`: ReactNode, The custom remove icon.
- `~~searchValue~~`: string, The current input "search" text Deprecated.
- `showSearch`: boolean | [Object](#showsearch), Whether select is searchable. Default single: false, multiple: true.
- `size`: `large` | `middle` | `small`, Size of Select input. Default `middle`.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Select component. Supports object or function.
- `suffixIcon`: ReactNode, The custom suffix icon. Customize icon will not response click open to avoid icon designed to do other interactive. You can use `pointer-events: none` style to bypass. Default `<DownOutlined />`.
- `tagRender`: (props) => ReactNode, Customize tag render, only applies when `mode` is set to `multiple` or `tags`.
- `labelRender`: (props: LabelInValueType) => ReactNode, Customize selected label render (LabelInValueType definition see [LabelInValueType](https://github.com/react-component/select/blob/b39c28aa2a94e7754ebc570f200ab5fd33bd31e7/src/Select.tsx#L70)). Version 5.15.0.
- `tokenSeparators`: string\[], Separator used to tokenize, only applies when `mode="tags"`.
- `value`: string | string\[] | <br />number | number\[] | <br />LabeledValue | LabeledValue\[], Current selected option (considered as a immutable array).
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of selector. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `virtual`: boolean, Disable virtual scroll when set to false. Default true. Version 4.1.0.
- `onActive`: function(value: string | number | LabeledValue), Called when keyboard or mouse interaction occurs.
- `onBlur`: function, Called when blur.
- `onChange`: function(value, option:Option | Array&lt;Option>), Called when select an option or input value change.
- `onClear`: function, Called when clear. Version 4.6.0.
- `onDeselect`: function(value: string | number | LabeledValue), Called when an option is deselected, param is the selected option's value. Only called for `multiple` or `tags`, effective in multiple or tags mode only.
- `~~onDropdownVisibleChange~~`: (open: boolean) => void, Called when dropdown open, use `onOpenChange` instead.
- `onOpenChange`: (open: boolean) => void, Called when dropdown open.
- `onFocus`: (event: FocusEvent) => void, Called when focus.
- `onInputKeyDown`: (event: KeyboardEvent) => void, Called when key pressed.
- `onPopupScroll`: (event: UIEvent) => void, Called when dropdown scrolls.
- `~~onSearch~~`: function(value: string), Callback function that is fired when input changed Deprecated.
- `onSelect`: function(value: string | number | LabeledValue, option: Option), Called when an option is selected, the params are option's value (or key) and option instance.

### showSearch Props

#### Required

- No required properties.

#### Optional

- `autoClearSearchValue`: boolean, Whether the current search will be cleared on selecting an item. Only applies when `mode` is set to `multiple` or `tags`. Default true.
- `filterOption`: boolean | function(inputValue, option), If true, filter options by input, if function, filter options against it. The function will receive two arguments, `inputValue` and `option`, if the function returns `true`, the option will be included in the filtered set; Otherwise, it will be excluded. Default true.
- `filterSort`: (optionA: Option, optionB: Option, info: { searchValue: string }) => number, Sort function for search options sorting, see [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)'s compareFunction. Version `searchValue`: 5.19.0.
- `optionFilterProp`: string | string[], Which prop value of option will be used for filter if filterOption is true. <br/> If `options` is set, it should be set to `label`. <br/> When a string[] is provided, multiple fields are searched using OR matching. Default `value`. Version `string[]`: 6.1.0.
- `searchValue`: string, The current input "search" text.
- `onSearch`: function(value: string), Callback function that is fired when input changed.

### Option props

#### Required

- No required properties.

#### Optional

- `className`: string, The additional class to option.
- `disabled`: boolean, Disable this option. Default false.
- `title`: string, `title` attribute of Select Option.
- `value`: string | number, Default to filter with this property.

### OptGroup props

#### Required

- No required properties.

#### Optional

- `key`: string, Group key.
- `label`: React.ReactNode, Group label.
- `className`: string, The additional class to option.
- `title`: string, `title` attribute of Select Option.

## Methods

- `blur()`:
- `focus()`:

## Common Scenario Examples

### Scenario 1: Basic Usage

```tsx
import { Select } from 'antd';

const options = [
  { value: '1', label: 'Text 1' }, { value: '2', label: 'Text 2' }, { value: '3', label: 'Text 3' }, ];

const BasicSelect: React.FC = () => (
  <Select
    style={{ width: 200 }}
    placeholder="Please select"
    options={options}
    onChange={(value) => console.log(value)}
  />
);
```

### Scenario 2: Select with search field

```tsx
import { useState } from 'react';
import { Select } from 'antd';

const MultipleSelect: React.FC = () => {
  const [value, setValue] = useState<string[]>([]);

  return (
    <Select
      mode="multiple"
      style={{ width: '100%' }}
      placeholder="Please selectText"
      value={value}
      onChange={setValue}
      options={[
        { value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, { value: 'angular', label: 'Angular' }, ]}
      maxTagCount={2}
    />
  );
};
```

### Scenario 3: Custom Search

```tsx
import { Select } from 'antd';

const SearchableSelect: React.FC = () => (
  <Select
    showSearch
    placeholder="SearchText"
    filterOption={(input, option) =>
      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    }
    options={[
      { value: 'jack', label: 'Jack Chen' }, { value: 'lucy', label: 'Lucy Liu' }, { value: 'tom', label: 'Tom Hanks' }, ]}
  />
);
```

### Scenario 4: Multi field search

```tsx
import { useRef, useState } from 'react';
import { Select } from 'antd';

const RemoteSelect: React.FC = () => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    clearTimeout(debounceTimer.current);
    if (!value) {
      setOptions([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetch(`/api/search?q=${value}`)
        .then((res) => res.json())
        .then((data) => setOptions(data))
        .finally(() => setLoading(false));
    }, 500);
  };

  return (
    <Select
      showSearch
      placeholder="TextSearch"
      onSearch={handleSearch}
      loading={loading}
      options={options}
      filterOption={false}
    />
  );
};
```

### Scenario 5: multiple selection

```tsx
import { Select } from 'antd';

const GroupedSelect: React.FC = () => (
  <Select
    placeholder="Text"
    options={[
      {
        label: 'Text', options: [
          { value: 'mango', label: 'Text' }, { value: 'banana', label: 'Text' }, ], }, {
        label: 'Text', options: [
          { value: 'apple', label: 'Text' }, { value: 'pear', label: 'Text' }, ], }, ]}
  />
);
```

### Scenario 6: Sizes

```tsx
import { useState } from 'react';
import { Select } from 'antd';

const TagSelect: React.FC = () => {
  const [options, setOptions] = useState([
    { value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, ]);
  const [value, setValue] = useState<string[]>([]);

  const handleChange = (newValue: string[]) => {
    const notExist = newValue.find((v) => !options.find((opt) => opt.value === v));
    if (notExist) {
      setOptions([.options, { value: notExist, label: notExist }]);
    }
    setValue(newValue);
  };

  return (
    <Select
      mode="tags"
      value={value}
      onChange={handleChange}
      options={options}
      placeholder="Text"
    />
  );
};
```

## Usage Recommendations

Use Select to a dropdown menu for displaying choices.

## Example Code

```tsx
import { Select, Space } from 'antd';

const options = [
  { value: 'jack', label: 'Jack' }, { value: 'lucy', label: 'Lucy' }, { value: 'tom', label: 'Tom' }, ];

const App: React.FC = () => (
  <Space wrap>
    <Select
      style={{ width: 200 }}
      placeholder="Please select"
      options={options}
      onChange={(value) => console.log(value)}
    />
    <Select
      mode="multiple"
      style={{ width: 300 }}
      placeholder="Multiple select"
      options={options}
    />
  </Space>
);
```

## Result

Renders a Select component.

## References
- Component docs: `https://ant.design/components/select` — use for API details, defaults, and official examples.