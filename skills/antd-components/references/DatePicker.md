# DatePicker — To select or input a date.

## Overview

To select or input a date.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- By clicking the input box, you can select a date from a popup calendar.
## Input Fields

### API

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean | { clearIcon?: ReactNode }, Customize clear button. Default true. Version 5.8.0: Support object type.
- `className`: string, The picker className.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dateRender`: function(currentDate: dayjs, today: dayjs) => React.ReactNode, Custom rendering function for date cells, >= 5.4.0 use `cellRender` instead. Version < 5.4.0.
- `cellRender`: (current: dayjs, info: { originNode: React.ReactElement,today: DateType, range?: 'start' | 'end', type: PanelMode, locale?: Locale, subType?: 'hour' | 'minute' | 'second' | 'meridiem' }) => React.ReactNode, Custom rendering function for picker cells. Version 5.4.0.
- `components`: Record<Panel | 'input', React.ComponentType>, Custom panels. Version 5.14.0.
- `defaultOpen`: boolean, Initial open state of picker.
- `disabled`: \[boolean, boolean], If disable start or end.
- `disabledDate`: (currentDate: dayjs, info: { from?: dayjs, type: Picker }) => boolean, Specify the date that cannot be selected. Version `info`: 5.14.0.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-MM-DD HH:mm:ss`.
- `order`: boolean, Auto order date when multiple or range selection. Default true. Version 5.14.0.
- `preserveInvalidOnBlur`: boolean, Not clean input on blur even when the typing is invalidate. Default false. Version 5.14.0.
- `~~popupClassName~~`: string, To customize the className of the popup calendar, use `classNames.popup.root` instead. Version 4.23.0.
- `getPopupContainer`: function(trigger), To set the container of the floating layer, while the default is to create a `div` element in `body`.
- `inputReadOnly`: boolean, Set the `readonly` attribute of the input tag (avoids virtual keyboard on touch devices). Default false.
- `locale`: object, Localization configuration. Default [default](https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json).
- `minDate`: dayjs, The minimum date, which also limits the range of panel switching. Version 5.14.0.
- `maxDate`: dayjs, The maximum date, which also limits the range of panel switching. Version 5.14.0.
- `mode`: `time` | `date` | `month` | `year` | `decade`, The picker panel mode( [Cannot select year or month anymore?](/docs/react/faq#when-set-mode-to-datepickerrangepicker-cannot-select-year-or-month-anymore) ).
- `needConfirm`: boolean, Need click confirm button to trigger value change. Default `false` when `multiple`. Version 5.14.0.
- `nextIcon`: ReactNode, The custom next icon. Version 4.17.0.
- `open`: boolean, The open state of picker.
- `panelRender`: (panelNode) => ReactNode, Customize panel render. Version 4.5.0.
- `picker`: `date` | `week` | `month` | `quarter` | `year`, Set picker type. Default `date`. Version `quarter`: 4.1.0.
- `placeholder`: string | \[string,string], The placeholder of date input.
- `placement`: `bottomLeft` `bottomRight` `topLeft` `topRight`, The position where the selection box pops up. Default bottomLeft.
- `~~popupStyle~~`: CSSProperties, To customize the style of the popup calendar, use `styles.popup.root` instead. Default {}.
- `prefix`: ReactNode, The custom prefix. Version 5.22.0.
- `prevIcon`: ReactNode, The custom prev icon. Version 4.17.0.
- `previewValue`: false | hover, When the user selects the date hover option, the value of the input field undergoes a temporary change. Default hover. Version 6.0.0.
- `presets`: { label: React.ReactNode, value: (Dayjs | (() => Dayjs))\[] }\[], The preset ranges for quick selection, Since `5.8.0`, preset value supports callback function.
- `size`: `large` | `middle` | `small`, To determine the size of the input box, the height of `large` and `small`, are 40px and 24px respectively, while default size is 32px.
- `status`: 'error' | 'warning', Set validation status. Version 4.19.0.
- `style`: CSSProperties, To customize the style of the input box. Default {}.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `suffixIcon`: ReactNode, The custom suffix icon.
- `superNextIcon`: ReactNode, The custom super next icon. Version 4.17.0.
- `superPrevIcon`: ReactNode, The custom super prev icon. Version 4.17.0.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variants of picker. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `onOpenChange`: function(open), Callback function, can be executed whether the popup calendar is popped up or closed.
- `onPanelChange`: function(value, mode), Callback function for panel changing.

### DatePicker Props

#### Required

- No required properties.

#### Optional

- `defaultPickerValue`: [dayjs](https://day.js.org/), Default panel date, will be reset when panel open. Version 5.14.0.
- `defaultValue`: [dayjs](https://day.js.org/), To set default date, if start time or end time is null or undefined, the date range will be an open interval.
- `disabledTime`: function(date), To specify the time that cannot be selected.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-MM-DD`.
- `multiple`: boolean, Enable multiple selection. Not support `showTime`. Default false. Version 5.14.0.
- `pickerValue`: [dayjs](https://day.js.org/), Panel date. Used for controlled switching of panel date. Work with `onPanelChange`. Version 5.14.0.
- `renderExtraFooter`: (mode) => React.ReactNode, Render extra footer in panel.
- `showNow`: boolean, Show the fast access of current datetime. Version 4.4.0.
- `showTime`: object | boolean, To provide an additional time selection. Default [TimePicker Options](/components/time-picker/#api).
- `~~showTime.defaultValue~~`: [dayjs](https://day.js.org/), Use `showTime.defaultOpenValue` instead. Default dayjs(). Version 5.27.3.
- `showTime.defaultOpenValue`: [dayjs](https://day.js.org/), To set default time of selected date, [demo](#date-picker-demo-disabled-date). Default dayjs().
- `showWeek`: boolean, Show week info when in DatePicker. Default false. Version 5.14.0.
- `value`: [dayjs](https://day.js.org/), To set date.
- `onChange`: function(date: dayjs | null, dateString: string | null), Callback function, can be executed when the selected time is changing.
- `onOk`: function(), Callback when click ok button.
- `onPanelChange`: function(value, mode), Callback function for panel changing.

### DatePicker\[picker=year]

#### Required

- No required properties.

#### Optional

- `defaultValue`: [dayjs](https://day.js.org/), To set default date.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY`.
- `multiple`: boolean, Enable multiple selection. Default false. Version 5.14.0.
- `renderExtraFooter`: () => React.ReactNode, Render extra footer in panel.
- `value`: [dayjs](https://day.js.org/), To set date.
- `onChange`: function(date: dayjs | null, dateString: string | null), Callback function, can be executed when the selected time is changing.

### DatePicker\[picker=quarter]

#### Required

- No required properties.

#### Optional

- `defaultValue`: [dayjs](https://day.js.org/), To set default date.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-\QQ`.
- `multiple`: boolean, Enable multiple selection. Default false. Version 5.14.0.
- `renderExtraFooter`: () => React.ReactNode, Render extra footer in panel.
- `value`: [dayjs](https://day.js.org/), To set date.
- `onChange`: function(date: dayjs | null, dateString: string | null), Callback function, can be executed when the selected time is changing.

### DatePicker\[picker=month]

#### Required

- No required properties.

#### Optional

- `defaultValue`: [dayjs](https://day.js.org/), To set default date.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-MM`.
- `multiple`: boolean, Enable multiple selection. Default false. Version 5.14.0.
- `renderExtraFooter`: () => React.ReactNode, Render extra footer in panel.
- `value`: [dayjs](https://day.js.org/), To set date.
- `onChange`: function(date: dayjs | null, dateString: string | null), Callback function, can be executed when the selected time is changing.

### DatePicker\[picker=week]

#### Required

- No required properties.

#### Optional

- `defaultValue`: [dayjs](https://day.js.org/), To set default date.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-wo`.
- `multiple`: boolean, Enable multiple selection. Default false. Version 5.14.0.
- `renderExtraFooter`: (mode) => React.ReactNode, Render extra footer in panel.
- `value`: [dayjs](https://day.js.org/), To set date.
- `onChange`: function(date: dayjs | null, dateString: string | null), Callback function, can be executed when the selected time is changing.
- `showWeek`: boolean, Show week info when in DatePicker. Default true. Version 5.14.0.

### RangePicker Props

#### Required

- No required properties.

#### Optional

- `allowEmpty`: \[boolean, boolean], Allow start or end input leave empty. Default \[false, false].
- `cellRender`: (current: dayjs, info: { originNode: React.ReactElement,today: DateType, range?: 'start' | 'end', type: PanelMode, locale?: Locale, subType?: 'hour' | 'minute' | 'second' | 'meridiem' }) => React.ReactNode, Custom rendering function for picker cells. Version 5.4.0.
- `dateRender`: function(currentDate: dayjs, today: dayjs) => React.ReactNode, Custom rendering function for date cells, >= 5.4.0 use `cellRender` instead. Version < 5.4.0.
- `defaultPickerValue`: [dayjs](https://day.js.org/), Default panel date, will be reset when panel open. Version 5.14.0.
- `defaultValue`: \[[dayjs](https://day.js.org/), [dayjs](https://day.js.org/)], To set default date.
- `disabled`: \[boolean, boolean], If disable start or end.
- `disabledTime`: function(date: dayjs, partial: `start` | `end`, info: { from?: dayjs }), To specify the time that cannot be selected. Version `info.from`: 5.17.0.
- `format`: [formatType](#formattype), To set the date format. refer to [dayjs#format](https://day.js.org/docs/en/display/format). Default `YYYY-MM-DD HH:mm:ss`.
- `id`: { start?: string, end?: string }, Config input ids. Version 5.14.0.
- `pickerValue`: [dayjs](https://day.js.org/), Panel date. Used for controlled switching of panel date. Work with `onPanelChange`. Version 5.14.0.
- `presets`: { label: React.ReactNode, value: (Dayjs | (() => Dayjs))\[] }\[], The preset ranges for quick selection, Since `5.8.0`, preset value supports callback function.
- `renderExtraFooter`: () => React.ReactNode, Render extra footer in panel.
- `separator`: React.ReactNode, Set separator between inputs. Default `<SwapRightOutlined />`.
- `showTime`: object | boolean, To provide an additional time selection. Default [TimePicker Options](/components/time-picker/#api).
- `~~showTime.defaultValue~~`: [dayjs](https://day.js.org/)\[], Use `showTime.defaultOpenValue` instead. Default \[dayjs(), dayjs()]. Version 5.27.3.
- `showTime.defaultOpenValue`: [dayjs](https://day.js.org/)\[], To set default time of selected date, [demo](#date-picker-demo-disabled-date). Default \[dayjs(), dayjs()].
- `value`: \[[dayjs](https://day.js.org/), [dayjs](https://day.js.org/)], To set date.
- `onCalendarChange`: function(dates: \[dayjs, dayjs], dateStrings: \[string, string], info: { range:`start`|`end` }), Callback function, can be executed when the start time or the end time of the range is changing. `info` argument is added in 4.4.0.
- `onChange`: function(dates: \[dayjs, dayjs] | null, dateStrings: \[string, string] | null), Callback function, can be executed when the selected time is changing.
- `onFocus`: function(event, { range: 'start' | 'end' }), Trigger when get focus. Version `range`: 5.14.0.
- `onBlur`: function(event, { range: 'start' | 'end' }), Trigger when lose focus. Version `range`: 5.14.0.

## Methods

- `blur()`:
- `focus()`:

## Common Scenario Examples

### Scenario 1: Basic

```tsx
import { DatePicker, Space } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';

const App: React.FC = () => {
  const onChange: DatePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <DatePicker onChange={onChange} placeholder="Text" />

      <DatePicker onChange={onChange} picker="week" placeholder="Text" />

      <DatePicker onChange={onChange} picker="month" placeholder="Text" />

      <DatePicker onChange={onChange} picker="year" placeholder="Text" />
    </Space>
  );
};
```

### Scenario 2: Range Picker

```tsx
import { DatePicker, Space } from 'antd';
import type { DatePickerProps } from 'antd';

const App: React.FC = () => {
  const onChange: DatePickerProps['onChange'] = (date, dateString) => {
    console.log('Text:', date, dateString);
  };

  const onOk: DatePickerProps['onOk'] = (date) => {
    console.log('OKText:', date);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <DatePicker showTime onChange={onChange} onOk={onOk} placeholder="Text" />

      <DatePicker
        showTime={{
          format: 'HH:mm', hourStep: 1, minuteStep: 15, }}
        format="YYYY-MM-DD HH:mm"
        onChange={onChange}
        placeholder="Text"
      />

      <DatePicker
        showTime={{ use12Hours: true, format: 'h:mm A' }}
        format="YYYY-MM-DD h:mm A"
        onChange={onChange}
        placeholder="12 Text"
      />
    </Space>
  );
};
```

### Scenario 3: Switchable picker

```tsx
import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';

const App: React.FC = () => {
  const { RangePicker } = DatePicker;

  const onChange: DatePickerProps['onChange'] = (dates, dateStrings) => {
    console.log('Text:', dates, dateStrings);
  };

  return (
    <>
      <RangePicker onChange={onChange} placeholder={['Text', 'Text']} />

      <RangePicker showTime onChange={onChange} placeholder={['Text', 'Text']} />

      <RangePicker
        disabledDate={(current) => {
          return current && current < dayjs().startOf('day');
        }}
        placeholder={['Text', 'Text']}
      />
    </>
  );
};
```

### Scenario 4: Date Format

```tsx
import { Button, DatePicker, Space } from 'antd';
import type { DatePickerProps, PresetRanges } from 'antd';
import dayjs from 'dayjs';

const App: React.FC = () => {
  const { RangePicker } = DatePicker;

  const disabledDate: DatePickerProps['disabledDate'] = (current) => {
    return current && (current.day() === 0 || current.day() === 6);
  };

  const presetRanges: PresetRanges = {
    today: [dayjs(), dayjs()], '7days': [dayjs().subtract(7, 'day'), dayjs()], '30days': [dayjs().subtract(30, 'day'), dayjs()], };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <DatePicker disabledDate={disabledDate} placeholder="Text" />

      <RangePicker presets={presetRanges} placeholder={['Text', 'Text']} />

      <RangePicker
        disabledTime={(date, partial) => {
          if (partial === 'start') {
            return {
              disabledHours: () => [0, 1, 2], // Text 0-2 Text
            };
          }
          return {};
        }}
        showTime
        placeholder={['Text', 'Text']}
      />
    </Space>
  );
};
```

### Scenario 5: Choose Time

```tsx
import { useState } from 'react';
import { Button, DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';

const App: React.FC = () => {
  const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs());

  const onChange: DatePickerProps['onChange'] = (newDate) => {
    setDate(newDate);
  };

  return (
    <>
      <DatePicker value={date} onChange={onChange} format="YYYY/MM/DD" placeholder="Text" />

      <Button onClick={() => setDate(null)}>Text</Button>

      {date && <p>Text: {date.format('YYYY-MM-DD HH:mm:ss')}</p>}
    </>
  );
};
```

### Scenario 6: Disabled

```tsx
import { useState } from 'react';
import { DatePicker, Space } from 'antd';
import type { DatePickerProps, Dayjs } from 'antd';
import locale from 'antd/locale/zh_CN';
import dayjs from 'dayjs';

const App: React.FC = () => {
  const cellRender: DatePickerProps['cellRender'] = (date, info) => {
    if (date.date() === 1) {
      return <div className="special">1st</div>;
    }
    return info.originNode;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <DatePicker cellRender={cellRender} placeholder="Text" />

      <DatePicker locale={locale} placeholder="Text" />

      <DatePicker allowClear={false} placeholder="Text" />

      <DatePicker inputReadOnly placeholder="Text" />
    </Space>
  );
};
```

## Usage Recommendations

Use DatePicker to to select or input a date.

## Example Code

```tsx
import { DatePicker, Space } from 'antd';
import type { DatePickerProps } from 'antd';

const { RangePicker } = DatePicker;

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  console.log(date, dateString);
};

const App: React.FC = () => (
  <Space direction="vertical">
    <DatePicker onChange={onChange} />
    <DatePicker onChange={onChange} picker="week" />
    <DatePicker onChange={onChange} picker="month" />
    <DatePicker onChange={onChange} picker="year" />
    <RangePicker />
    <DatePicker showTime onChange={onChange} />
  </Space>
);
```

## Result

Renders a DatePicker component.

## References
- Component docs: `https://ant.design/components/date-picker` — use for API details, defaults, and official examples.