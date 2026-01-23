# TimePicker — To select/input a time.

## Overview

To select/input a time.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- By clicking the input box, you can select a time from a popup panel.
## Input Fields

### TimePicker Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Customize clear icon. Default true. Version 5.8.0: Support object type.
- `cellRender`: (current: number, info: { originNode: React.ReactElement, today: dayjs, range?: 'start' | 'end', subType: 'hour' | 'minute' | 'second' | 'meridiem' }) => React.ReactNode, Custom rendering function for picker cells. Version 5.4.0.
- `changeOnScroll`: boolean, Trigger selection when scroll the column. Default false. Version 5.14.0.
- `className`: string, The className of picker.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultValue`: [dayjs](http://day.js.org/), To set default time.
- `disabled`: boolean, Determine whether the TimePicker is disabled. Default false.
- `disabledTime`: [DisabledTime](#disabledtime), To specify the time that cannot be selected. Version 4.19.0.
- `format`: string, To set the time format. Default `HH:mm:ss`.
- `getPopupContainer`: function(trigger), To set the container of the floating layer, while the default is to create a div element in body.
- `hideDisabledOptions`: boolean, Whether hide the options that can not be selected. Default false.
- `hourStep`: number, Interval between hours in picker. Default 1.
- `inputReadOnly`: boolean, Set the `readonly` attribute of the input tag (avoids virtual keyboard on touch devices). Default false.
- `minuteStep`: number, Interval between minutes in picker. Default 1.
- `needConfirm`: boolean, Need click confirm button to trigger value change. Version 5.14.0.
- `open`: boolean, Whether to popup panel. Default false.
- `placeholder`: string | \[string, string], Display when there's no value. Default `Select a time`.
- `placement`: `bottomLeft` `bottomRight` `topLeft` `topRight`, The position where the selection box pops up. Default bottomLeft.
- `~~popupClassName~~`: string, The className of panel, please use `classNames.popup` instead.
- `~~popupStyle~~`: CSSProperties, The style of panel, please use `styles.popup` instead.
- `prefix`: ReactNode, The custom prefix. Version 5.22.0.
- `previewValue`: false | hover, When the user selects the time hover option, the value of the input field undergoes a temporary change. Default hover. Version 6.0.0.
- `renderExtraFooter`: () => ReactNode, Called from time picker panel to render some addon to its bottom.
- `secondStep`: number, Interval between seconds in picker. Default 1.
- `showNow`: boolean, Whether to show `Now` button on panel. Version 4.4.0.
- `size`: `large` | `middle` | `small`, To determine the size of the input box, the height of `large` and `small`, are 40px and 24px respectively, while default size is 32px.
- `status`: 'error' | 'warning' | 'success' | 'validating', Set validation status. Version 4.19.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `suffixIcon`: ReactNode, The custom suffix icon.
- `use12Hours`: boolean, Display as 12 hours format, with default format `h:mm:ss a`. Default false.
- `value`: [dayjs](http://day.js.org/), To set time.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of picker. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `onCalendarChange`: function(dates: \[dayjs, dayjs], dateStrings: \[string, string], info: { range:`start`|`end` }), Callback function, can be executed when the start time or the end time of the range is changing. `info` argument is added in 4.4.0.
- `onChange`: function(time: dayjs, timeString: string): void, A callback function, can be executed when the selected time is changing.
- `onOpenChange`: (open: boolean) => void, A callback function which will be called while panel opening/closing.

### RangePicker Props

#### Required

- No required properties.

#### Optional

- `disabledTime`: [RangeDisabledTime](#rangedisabledtime), To specify the time that cannot be selected. Version 4.19.0.
- `order`: boolean, Order start and end time. Default true. Version 4.1.0.

## Methods

- `blur()`:
- `focus()`:

## Usage Recommendations

Use TimePicker to to select/input a time.

## Example Code

```tsx
import { Space, TimePicker } from 'antd';
import type { TimePickerProps } from 'antd';
import dayjs from 'dayjs';

const format = 'HH:mm';

const onChange: TimePickerProps['onChange'] = (time, timeString) => {
  console.log(time, timeString);
};

const App: React.FC = () => (
  <Space direction="vertical">
    <TimePicker onChange={onChange} defaultOpenValue={dayjs('00:00:00', 'HH:mm:ss')} />

    <TimePicker defaultValue={dayjs('12:08', format)} format={format} />

    <TimePicker use12Hours onChange={onChange} />
    <TimePicker use12Hours format="h:mm:ss A" onChange={onChange} />

    <TimePicker.RangePicker />

    <TimePicker disabled defaultValue={dayjs('12:08:00', 'HH:mm:ss')} />

    <TimePicker size="small" />
    <TimePicker />
    <TimePicker size="large" />

    <TimePicker minuteStep={15} secondStep={10} />

    <TimePicker renderExtraFooter={() => <span>Extra Footer</span>} />

    <TimePicker value={dayjs('12:08', format)} format={format} />

    <TimePicker
      disabledTime={() => ({
        disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 22, 23], disabledMinutes: (hour) => (hour === 8 ? [0, 1, 2, 3, 4, 5] : []), disabledSeconds: () => [], })}
    />
  </Space>
);
```

## Result

Renders a TimePicker component.

## References
- Component docs: `https://ant.design/components/time-picker` — use for API details, defaults, and official examples.