# AutoComplete — Autocomplete function of input field.

## Overview

Autocomplete function of input field.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When you need an input box instead of a selector.
- When you need input suggestions or helping text.
- AutoComplete is an input box with text hints, and users can type freely. The keyword is aiding **input**.
- Select is selecting among given choices. The keyword is **select**.
## Input Fields

### AutoComplete Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Show clear button. Default false. Version 5.8.0: Support Object type.
- `backfill`: boolean, If backfill selected item the input when using keyboard. Default false.
- `children`: HTMLInputElement | HTMLTextAreaElement | React.ReactElement&lt;InputProps>, Customize input element. Default &lt;Input />.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultActiveFirstOption`: boolean, Whether active first option by default. Default true.
- `defaultOpen`: boolean, Initial open state of dropdown.
- `defaultValue`: string, Initial selected option.
- `disabled`: boolean, Whether disabled select. Default false.
- `~~dropdownRender~~`: (originNode: ReactNode) => ReactNode, Customize dropdown content, use `popupRender` instead. Version 4.24.0.
- `popupRender`: (originNode: ReactNode) => ReactNode, Customize dropdown content.
- `~~popupClassName~~`: string, The className of dropdown menu, use `classNames.popup.root` instead. Version 4.23.0.
- `~~dropdownStyle~~`: CSSProperties, The style of dropdown menu, use `styles.popup.root` instead.
- `popupMatchSelectWidth`: boolean | number, Determine whether the dropdown menu and the select input are the same width. Default set `min-width` same as input. Will ignore when value less than select width. `false` will disable virtual scroll. Default true.
- `~~filterOption~~`: boolean | function(inputValue, option), If true, filter options by input, if function, filter options against it. The function will receive two arguments, `inputValue` and `option`, if the function returns true, the option will be included in the filtered set; Otherwise, it will be excluded. Default true Deprecated.
- `getPopupContainer`: function(triggerNode), Parent node of the dropdown. Default to body, if you encountered positioning problems during scroll, try changing to the scrollable area and position relative to it. [Example](https://codesandbox.io/s/4j168r7jw0). Default () => document.body.
- `notFoundContent`: ReactNode, Specify content to show when no result matches.
- `open`: boolean, Controlled open state of dropdown.
- `options`: { label, value }\[], Select options. Will get better perf than jsx definition.
- `placeholder`: string, The placeholder of input.
- `showSearch`: true | [Object](#showsearch), search for configuration. Default true.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `size`: `large` | `middle` | `small`, The size of the input box.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `value`: string, Selected option.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of input. Default `outlined`. Version 5.13.0.
- `virtual`: boolean, Disable virtual scroll when set to false. Default true. Version 4.1.0.
- `onBlur`: function(), Called when leaving the component.
- `onChange`: function(value), Called when selecting an option or changing an input value.
- `~~onDropdownVisibleChange~~`: (open: boolean) => void, Called when dropdown open, use `onOpenChange` instead.
- `onOpenChange`: (open: boolean) => void, Called when dropdown open.
- `onFocus`: function(), Called when entering the component.
- `~~onSearch~~`: function(value), Called when searching items Deprecated.
- `onSelect`: function(value, option), Called when a option is selected. param is option's value and option instance.
- `onClear`: function, Called when clear. Version 4.6.0.
- `onInputKeyDown`: (event: KeyboardEvent) => void, Called when key pressed.
- `onPopupScroll`: (event: UIEvent) => void, Called when dropdown scrolls.

### showSearch Props

#### Required

- No required properties.

#### Optional

- `filterOption`: boolean | function(inputValue, option), If true, filter options by input, if function, filter options against it. The function will receive two arguments, `inputValue` and `option`, if the function returns true, the option will be included in the filtered set; Otherwise, it will be excluded. Default true.
- `onSearch`: function(value), Called when searching items.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use AutoComplete to autocomplete function of input field.

## Example Code

```tsx
import { useState } from 'react';
import { AutoComplete, Input, Space } from 'antd';
import type { AutoCompleteProps } from 'antd';

const mockVal = (str: string, repeat = 1) => ({
  value: str.repeat(repeat), });

const App: React.FC = () => {
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);
  const [anotherOptions, setAnotherOptions] = useState<AutoCompleteProps['options']>([]);

  const getPanelValue = (searchText: string) =>
    !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];

  const onSearch = (searchText: string) => {
    setOptions(getPanelValue(searchText));
  };

  const onSelect = (data: string) => {
    console.log('onSelect', data);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <AutoComplete
        options={options}
        style={{ width: 200 }}
        onSelect={onSelect}
        onSearch={onSearch}
        placeholder="input here"
      />

      <AutoComplete
        style={{ width: 200 }}
        options={[
          { value: 'Burns Bay Road' }, { value: 'Downing Street' }, { value: 'Wall Street' }, ]}
        placeholder="try to type `b`"
        filterOption={(inputValue, option) =>
          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
      />

      <AutoComplete options={options} style={{ width: 200 }} onSearch={onSearch}>
        <Input.TextArea placeholder="input here" style={{ height: 50 }} />
      </AutoComplete>

      <AutoComplete
        style={{ width: 200 }}
        options={[{ value: 'test@example.com' }, { value: 'test@example.org' }]}
        placeholder="Email"
        filterOption={(inputValue, option) =>
          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
      />

      <AutoComplete
        popupClassName="certain-category-search-dropdown"
        popupMatchSelectWidth={500}
        style={{ width: 250 }}
        options={[
          {
            label: 'Libraries', options: [
              { label: 'AntDesign', value: 'AntDesign' }, { label: 'AntDesign UI', value: 'AntDesign UI' }, ], }, {
            label: 'Solutions', options: [{ label: 'AntDesign solutions', value: 'AntDesign solutions' }], }, ]}
        placeholder="input here"
      />
    </Space>
  );
};
```

## Result

Renders an AutoComplete component.

## References
- Component docs: `https://ant.design/components/auto-complete` — use for API details, defaults, and official examples.