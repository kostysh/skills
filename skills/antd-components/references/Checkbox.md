# Checkbox — Collect user's choices.

## Overview

Collect user's choices.

## When To Use

- Used for selecting multiple values from several options.
- If you use only one checkbox, it is the same as using Switch to toggle between two states. The difference is that Switch will trigger the state change directly, but Checkbox just marks the state as changed and this needs to be submitted.
## Input Fields

### Checkbox Props

#### Required

- No required properties.

#### Optional

- `checked`: boolean, Specifies whether the checkbox is selected. Default false.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultChecked`: boolean, Specifies the initial state: whether or not the checkbox is selected. Default false.
- `disabled`: boolean, If disable all checkboxes. Default false.
- `indeterminate`: boolean, The indeterminate checked state of checkbox. Default false.
- `onChange`: (checkedValue: T[]) => void, The callback function that is triggered when the state changes.
- `onBlur`: function(), Called when leaving the component.
- `onFocus`: function(), Called when entering the component.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `blur()`: .
- `focus()`: .
- `nativeElement`:  Checkbox  DOM, Version 5.17.3.

### Checkbox.Group Props

#### Required

- No required properties.

#### Optional

- `defaultValue`: (string | number)\[], Default selected value. Default \[].
- `disabled`: boolean, If disable all checkboxes. Default false.
- `name`: string, The `name` property of all `input[type="checkbox"]` children.
- `options`: string\[] | number\[] | Option\[], Specifies options. Default \[].
- `value`: (string | number | boolean)\[], Used for setting the currently selected value. Default \[].
- `title`: `string`, title of the option.
- `className`: `string`, className of the option. Version 5.25.0.
- `style`: `React.CSSProperties`, styles of the option.
- `onChange`: (checkedValue: T[]) => void, The callback function that is triggered when the state changes.

## Methods

No public methods.

## Usage Recommendations

Use Checkbox to collect user's choices.

## Example Code

```tsx
import { useState } from 'react';
import { Checkbox } from 'antd';
import type { CheckboxProps, GetProp } from 'antd';

const options = [
  { label: 'Apple', value: 'Apple' }, { label: 'Pear', value: 'Pear' }, { label: 'Orange', value: 'Orange' }, ];

const App: React.FC = () => {
  const [checkedList, setCheckedList] = useState<string[]>(['Apple', 'Orange']);

  const checkAll = options.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < options.length;

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedList(e.target.checked ? options.map((o) => o.value) : []);
  };

  return (
    <>
      <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
        Check all
      </Checkbox>
      <Checkbox.Group
        options={options}
        value={checkedList}
        onChange={(list) => setCheckedList(list as string[])}
      />
    </>
  );
};
```

## Result

Renders a Checkbox component.

## References
- Component docs: `https://ant.design/components/checkbox` — use for API details, defaults, and official examples.