# Calendar — A container that displays data in calendar form.

## Overview

A container that displays data in calendar form.

## When To Use

- When data is in the form of dates, such as schedules, timetables, prices calendar, lunar calendar. This component also supports Year/Month switch.
## Input Fields

### Calendar Props

#### Required

- No required properties.

#### Optional

- `cellRender`: function(current: dayjs, info: { prefixCls: string, originNode: React.ReactElement, today: dayjs, range?: 'start' | 'end', type: PanelMode, locale?: Locale, subType?: 'hour' | 'minute' | 'second' | 'meridiem' }) => React.ReactNode, Customize cell content. Version 5.4.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `dateFullCellRender`: function(date: Dayjs): ReactNode, Customize the display of the date cell, the returned content will override the cell.
- `fullCellRender`: function(current: dayjs, info: { prefixCls: string, originNode: React.ReactElement, today: dayjs, range?: 'start' | 'end', type: PanelMode, locale?: Locale, subType?: 'hour' | 'minute' | 'second' | 'meridiem' }) => React.ReactNode, Customize cell content. Version 5.4.0.
- `defaultValue`: [dayjs](https://day.js.org/), The date selected by default.
- `disabledDate`: (currentDate: Dayjs) => boolean, Function that specifies the dates that cannot be selected, `currentDate` is same dayjs object as `value` prop which you shouldn't mutate it](https://github.com/ant-design/ant-design/issues/30987).
- `fullscreen`: boolean, Whether to display in full-screen. Default true.
- `showWeek`: boolean, Whether to display week number. Default false. Version 5.23.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `headerRender`: function(object:{value: Dayjs, type: 'year' | 'month', onChange: f(), onTypeChange: f()}), Render custom header in panel.
- `locale`: object, The calendar's locale. Default [(default)](https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json).
- `mode`: `month` | `year`, The display mode of the calendar. Default `month`.
- `validRange`: \[[dayjs](https://day.js.org/), [dayjs](https://day.js.org/)], To set valid range.
- `value`: [dayjs](https://day.js.org/), The current selected date.
- `onChange`: function(date: Dayjs), Callback for when date changes.
- `onPanelChange`: function(date: Dayjs, mode: string), Callback for when panel changes.
- `onSelect`: function(date: Dayjs, info: { source: 'year' | 'month' | 'date' | 'customize' }), Callback for when a date is selected, include source info. Version `info`: 5.6.0.

## Methods

No public methods.

## Usage Recommendations

Use Calendar to a container that displays data in calendar form.

## Example Code

```tsx
import { Badge, Calendar } from 'antd';
import type { BadgeProps, CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

const getListData = (value: Dayjs) => {
  let listData: { type: BadgeProps['status']; content: string }[] = [];
  switch (value.date()) {
    case 8:
      listData = [
        { type: 'warning', content: 'This is warning event.' }, { type: 'success', content: 'This is usual event.' }, ];
      break;
    case 15:
      listData = [{ type: 'error', content: 'This is error event.' }];
      break;
    default:
  }
  return listData;
};

const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
  if (info.type === 'date') {
    const listData = getListData(current);
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  }
  return info.originNode;
};

const App: React.FC = () => (
  <>
    <Calendar />

    <Calendar cellRender={cellRender} />

    <div style={{ width: 300 }}>
      <Calendar fullscreen={false} />
    </div>

    <Calendar validRange={[dayjs('2020-01-01'), dayjs('2020-12-31')]} />

    <Calendar
      onSelect={(date, { source }) => {
        if (source === 'date') {
          console.log('Date selected:', date.format('YYYY-MM-DD'));
        }
      }}
    />
  </>
);
```

## Result

Renders a Calendar component.

## References
- Component docs: `https://ant.design/components/calendar` — use for API details, defaults, and official examples.