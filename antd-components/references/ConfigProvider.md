# ConfigProvider — Provide a uniform configuration support for components.

## Overview

Provide a uniform configuration support for components.

## When To Use

- Use ConfigProvider to provide a uniform configuration support for components.
## Input Fields

### ConfigProvider Props

#### Required

- No required properties.

#### Optional

- `componentDisabled`: boolean, Config antd component `disabled`. Version 4.21.0.
- `componentSize`: `small` | `middle` | `large`, Config antd component size.
- `csp`: { nonce: string }, Set [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) config.
- `direction`: `ltr` | `rtl`, Set direction of layout. See [demo](#config-provider-demo-direction). Default `ltr`.
- `getPopupContainer`: `(trigger?: HTMLElement) => HTMLElement | ShadowRoot`, To set the container of the popup element. The default is to create a `div` element in `body`. Default () => document.body.
- `getTargetContainer`: `() => HTMLElement | Window | ShadowRoot`, Config Affix, Anchor scroll target container. Default () => window. Version 4.2.0.
- `iconPrefixCls`: string, Set icon prefix className. Default `anticon`. Version 4.11.0.
- `locale`: object, Language package setting, you can find the packages in [antd/locale](http://unpkg.com/antd/locale/).
- `popupMatchSelectWidth`: boolean | number, Determine whether the dropdown menu and the select input are the same width. Default set `min-width` same as input. Will ignore when value less than select width. `false` will disable virtual scroll. Version 5.5.0.
- `popupOverflow`: 'viewport' | 'scroll' <InlinePopover previewURL="https://user-images.githubusercontent.com/5378891/230344474-5b9f7e09-0a5d-49e8-bae8-7d2abed6c837.png"></InlinePopover>, Select like component popup logic. Can set to show in viewport or follow window scroll. Default 'viewport'. Version 5.5.0.
- `prefixCls`: string, Set prefix className. Default `ant`.
- `renderEmpty`: function(componentName: string): ReactNode, Set empty content of components. Ref [Empty](/components/empty/).
- `theme`: [Theme](/docs/react/customize-theme#theme), Set theme, ref [Customize Theme](/docs/react/customize-theme). Version 5.0.0.
- `variant`: `outlined` | `filled` | `borderless`, Set variant of data entry components. Version 5.19.0.
- `virtual`: boolean, Disable virtual scroll when set to `false`. Version 4.3.0.
- `warning`: { strict: boolean }, Config warning level, when `strict` is `false`, it will aggregate deprecated information into a single message. Version 5.10.0.

### Props

#### Required

- No required properties.

#### Optional

- `affix`: { className?: string, style?: React.CSSProperties }, Affix, Version 6.0.0.
- `alert`: { className?: string, style?: React.CSSProperties, closeIcon?: React.ReactNode, successIcon?: React.ReactNode, infoIcon?: React.ReactNode, warningIcon?: React.ReactNode, errorIcon?: React.ReactNode }, Alert, Version 5.7.0, `closeIcon`: 5.14.0, `successIcon`, `infoIcon`, `warningIcon`  `errorIcon`: 6.2.0.
- `anchor`: { className?: string, style?: React.CSSProperties, classNames?: [AnchorStyleConfig\["classNames"\]](/components/anchor-cn#semantic-dom), styles?: [AnchorStyleConfig\["styles"\]](/components/anchor-cn#semantic-dom) }, Anchor, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `avatar`: { className?: string, style?: React.CSSProperties }, Avatar, Version 5.7.0.
- `badge`: { className?: string, style?: React.CSSProperties, classNames?: [BadgeProps\["classNames"\]](/components/badge-cn#semantic-dom), styles?: [BadgeProps\["styles"\]](/components/badge-cn#semantic-dom) }, Badge, Version 5.7.0.
- `breadcrumb`: { className?: string, style?: React.CSSProperties, classNames?: [BreadcrumbConfig\["classNames"\]](/components/breadcrumb-cn#semantic-dom), styles?: [BreadcrumbConfig\["styles"\]](/components/breadcrumb-cn#semantic-dom), separator?: ReactNode, dropdownIcon?: ReactNode }, Breadcrumb, Version 5.7.0, `classNames`, `separator`  `styles`: 6.0.0, `dropdownIcon`: 6.2.0.
- `button`: { className?: string, style?: React.CSSProperties, classNames?: [ButtonProps\["classNames"\]](/components/button-cn#semantic-dom), styles?: [ButtonProps\["styles"\]](/components/button-cn#semantic-dom), autoInsertSpace?: boolean, variant?: ButtonVariantType, color?: ButtonColorType, shape?: [ButtonProps\["shape"\]](/components/button#api) }, Button, Version 5.6.0, `autoInsertSpace`: 5.17.0, `variant`  `color`: 5.25.0, `shape`: 5.27.0.
- `calendar`: { className?: string, style?: React.CSSProperties, classNames?: [CalendarConfig\["classNames"\]](/components/calendar-cn#semantic-dom), styles?: [CalendarConfig\["styles"\]](/components/calendar-cn#semantic-dom) }, Calendar, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `card`: { className?: string, style?: React.CSSProperties, classNames?: [CardProps\["classNames"\]](/components/card-cn#semantic-dom), styles?: [CardProps\["styles"\]](/components/card-cn#semantic-dom) }, Card, Version 5.7.0, `classNames`  `styles`: 5.14.0.
- `cardMeta`: { className?: string, style?: React.CSSProperties, classNames?: [CardMetaProps\["classNames"\]](/components/card-cn#semantic-dom), styles?: [CardMetaProps\["styles"\]](/components/card-cn#semantic-dom) }, Card.Meta, Version 6.0.0.
- `carousel`: { className?: string, style?: React.CSSProperties }, Carousel, Version 5.7.0.
- `cascader`: { className?: string, style?: React.CSSProperties }, Cascader, Version 5.7.0.
- `checkbox`: { className?: string, style?: React.CSSProperties, classNames?: [CheckboxConfig\["classNames"\]](/components/checkbox-cn#semantic-dom), styles?: [CheckboxConfig\["styles"\]](/components/checkbox-cn#semantic-dom) }, Checkbox, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `collapse`: { className?: string, style?: React.CSSProperties, expandIcon?: (props) => ReactNode, classNames?: [CollapseProps\["classNames"\]](/components/collapse-cn#semantic-dom), styles?: [CollapseProps\["styles"\]](/components/collapse-cn#semantic-dom) }, Collapse, Version 5.7.0, `expandIcon`: 5.15.0, `classNames`  `styles`: 6.0.0.
- `colorPicker`: { className?: string, style?: React.CSSProperties, classNames?: [ColorPickerConfig\["classNames"\]](/components/color-picker-cn#semantic-dom), styles?: [ColorPickerConfig\["styles"\]](/components/color-picker-cn#semantic-dom) }, ColorPicker, Version 5.7.0.
- `datePicker`: { className?: string, style?: React.CSSProperties, classNames?: [DatePickerConfig\["classNames"\]](/components/date-picker-cn#semantic-dom), styles?: [DatePickerConfig\["styles"\]](/components/date-picker-cn#semantic-dom) }, DatePicker, Version 5.7.0.
- `rangePicker`: { className?: string, style?: React.CSSProperties }, RangePicker, Version 5.11.0.
- `descriptions`: { className?: string, style?: React.CSSProperties, classNames?: [DescriptionsProps\["classNames"\]](/components/descriptions-cn#semantic-dom), styles?: [DescriptionsProps\["styles"\]](/components/descriptions-cn#semantic-dom) }, Descriptions, Version 5.7.0, `classNames`  `styles`: 5.23.0.
- `divider`: { className?: string, style?: React.CSSProperties, classNames?: [DividerProps\["classNames"\]](/components/divider-cn#semantic-dom), styles?: [DividerProps\["styles"\]](/components/divider-cn#semantic-dom) }, Divider .
- `drawer`: { className?: string, style?: React.CSSProperties, classNames?: [DrawerProps\["classNames"\]](/components/drawer-cn#semantic-dom), styles?: [DrawerProps\["styles"\]](/components/drawer-cn#semantic-dom), closeIcon?: ReactNode, closable?: [DrawerProps\["closable"\]](/components/drawer-cn#api)}, Drawer, Version 5.7.0, `classNames`  `styles`: 5.10.0, `closeIcon`: 5.14.0.
- `dropdown`: { className?: string, style?: React.CSSProperties, classNames?: [DropdownConfig\["classNames"\]](/components/dropdown-cn#semantic-dom), styles?: [DropdownConfig\["styles"\]](/components/dropdown-cn#semantic-dom) }, Dropdown .
- `empty`: { className?: string, style?: React.CSSProperties, classNames?:[EmptyProps\["classNames"\]](/components/empty-cn#api), styles?: [EmptyProps\["styles"\]](/components/empty-cn#api), image?: ReactNode }, Empty, Version 5.7.0, `classNames`  `styles`: 5.23.0, `image`: 5.27.0.
- `flex`: { className?: string, style?: React.CSSProperties, vertical?: boolean }, Flex, Version 5.10.0.
- `floatButton`: { className?: string, style?: React.CSSProperties, classNames?: [FloatButtonProps\["classNames"\]](/components/float-button-cn#semantic-dom), styles?: [FloatButtonProps\["styles"\]](/components/float-button-cn#semantic-dom), backTopIcon?: React.ReactNode }, FloatButton .
- `floatButtonGroup`: { closeIcon?: React.ReactNode, className?: string, style?: React.CSSProperties, classNames?: [FloatButtonProps\["classNames"\]](/components/float-button-cn#semantic-dom), styles?: [FloatButtonProps\["styles"\]](/components/float-button-cn#semantic-dom) }, FloatButton.Group .
- `form`: { className?: string, style?: React.CSSProperties, validateMessages?: [ValidateMessages](/components/form-cn#validatemessages), requiredMark?: boolean | `optional`, colon?: boolean, scrollToFirstError?: boolean | [Options](https://github.com/stipsan/scroll-into-view-if-needed/tree/ece40bd9143f48caf4b99503425ecb16b0ad8249#options), classNames?:[FormConfig\["classNames"\]](/components/form-cn#semantic-dom), styles?: [FormConfig\["styles"\]](/components/form-cn#semantic-dom) }, Form, Version `requiredMark`: 4.8.0; `colon`: 4.18.0; `scrollToFirstError`: 5.2.0; `className`  `style`: 5.7.0.
- `image`: { className?: string, style?: React.CSSProperties, preview?: { closeIcon?: React.ReactNode, classNames?:[ImageConfig\["classNames"\]](/components/image-cn#semantic-dom), styles?: [ImageConfig\["styles"\]](/components/image-cn#semantic-dom) }, fallback?: string }, Image, Version 5.7.0, `closeIcon`: 5.14.0, `classNames`  `styles`: 6.0.0.
- `input`: { autoComplete?: string, className?: string, style?: React.CSSProperties, classNames?:[InputConfig\["classNames"\]](/components/input-cn#semantic-input), styles?: [InputConfig\["styles"\]](/components/input-cn#semantic-input), allowClear?: boolean | { clearIcon?: ReactNode } }, Input, Version 5.7.0, `allowClear`: 5.15.0.
- `inputNumber`: { className?: string, style?: React.CSSProperties, classNames?: [InputNumberConfig\["classNames"\]](/components/input-number-cn#semantic-dom), styles?: [InputNumberConfig\["styles"\]](/components/input-number-cn#semantic-dom) }, Input .
- `otp`: { className?: string, style?: React.CSSProperties, classNames?: [OTPConfig\["classNames"\]](/components/input-cn#semantic-otp), styles?: [OTPConfig\["styles"\]](/components/input-cn#semantic-otp) }, OTP .
- `inputSearch`: { className?: string, style?: React.CSSProperties, classNames?: [InputSearchConfig\["classNames"\]](/components/input-cn#semantic-search), styles?: [InputSearchConfig\["styles"\]](/components/input-cn#semantic-search) }, Search .
- `textArea`: { autoComplete?: string, className?: string, style?: React.CSSProperties, classNames?:[TextAreaConfig\["classNames"\]](/components/input-cn#semantic-textarea), styles?: [TextAreaConfig\["styles"\]](/components/input-cn#semantic-textarea), allowClear?: boolean | { clearIcon?: ReactNode } }, TextArea, Version 5.15.0.
- `layout`: { className?: string, style?: React.CSSProperties }, Layout, Version 5.7.0.
- `list`: { className?: string, style?: React.CSSProperties, item?:{ classNames: [ListItemProps\["classNames"\]](/components/list-cn#listitem), styles: [ListItemProps\["styles"\]](/components/list-cn#listitem) } }, List, Version 5.7.0.
- `masonry`: { className?: string, style?: React.CSSProperties, classNames?: [MasonryProps\["classNames"\]](/components/masonry#semantic-dom), styles?: [MasonryProps\["styles"\]](/components/masonry#semantic-dom) }, Masonry .
- `menu`: { className?: string, style?: React.CSSProperties, expandIcon?: ReactNode | props => ReactNode }, Menu, Version 5.7.0, `expandIcon`: 5.15.0.
- `mentions`: { className?: string, style?: React.CSSProperties, classNames?:[MentionsConfig\["classNames"\]](/components/mentions-cn#semantic-dom), styles?: [MentionsConfig\["styles"\]](/components/mentions-cn#semantic-dom) }, Mentions, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `message`: { className?: string, style?: React.CSSProperties, classNames?: [MessageConfig\["classNames"\]](/components/message-cn#semantic-dom), styles?: [MessageConfig\["styles"\]](/components/message-cn#semantic-dom) }, Message, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `modal`: { className?: string, style?: React.CSSProperties, classNames?: [ModalProps\["classNames"\]](/components/modal-cn#semantic-dom), styles?: [ModalProps\["styles"\]](/components/modal-cn#semantic-dom), closeIcon?: React.ReactNode }, Modal, Version 5.7.0, `classNames`  `styles`: 5.10.0, `closeIcon`: 5.14.0.
- `notification`: { className?: string, style?: React.CSSProperties, closeIcon?: React.ReactNode, classNames?: [NotificationConfig\["classNames"\]](/components/notification-cn#semantic-dom), styles?: [NotificationConfig\["styles"\]](/components/notification-cn#semantic-dom) }, Notification, Version 5.7.0, `closeIcon`: 5.14.0, `classNames`  `styles`: 6.0.0.
- `pagination`: { showSizeChanger?: boolean, totalBoundaryShowSizeChanger?: number, className?: string, style?: React.CSSProperties, classNames?:[PaginationConfig\["classNames"\]](/components/pagination-cn#semantic-dom), styles?: [PaginationConfig\["styles"\]](/components/pagination-cn#semantic-dom) }, Pagination, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `progress`: { className?: string, style?: React.CSSProperties, classNames?: [ProgressConfig\["classNames"\]](/components/progress#semantic-dom), styles?: [ProgressConfig\["styles"\]](/components/progress#semantic-dom) }, Progress .
- `radio`: { className?: string, style?: React.CSSProperties, classNames?: [RadioConfig\["classNames"\]](/components/radio-cn#semantic-dom), styles?: [RadioConfig\["styles"\]](/components/radio-cn#semantic-dom) }, Radio, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `rate`: { className?: string, style?: React.CSSProperties }, Rate, Version 5.7.0.
- `result`: { className?: string, style?: React.CSSProperties, classNames?: [ResultProps\["classNames"\]](/components/result-cn#semantic-dom), styles?: [ResultProps\["styles"\]](/components/result-cn#semantic-dom) }, Result, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `ribbon`: { className?: string, style?: React.CSSProperties, classNames?: [RibbonProps\["classNames"\]](/components/badge-cn#semantic-dom), styles?: [RibbonProps\["styles"\]](/components/badge-cn#semantic-dom) }, Ribbon, Version 6.0.0.
- `skeleton`: { className?: string, style?: React.CSSProperties, classNames?: [SkeletonProps\["classNames"\]](/components/skeleton-cn#semantic-dom), styles?: [SkeletonProps\["styles"\]](/components/skeleton-cn#semantic-dom) }, Skeleton, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `segmented`: { className?: string, style?: React.CSSProperties, classNames?: [SegmentedProps\["classNames"\]](/components/segmented-cn#semantic-dom), styles?: [SegmentedProps\["styles"\]](/components/segmented-cn#semantic-dom) }, Segmented, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `select`: { className?: string, showSearch?: boolean, style?: React.CSSProperties, classNames?: [SelectConfig\["classNames"\]](/components/select-cn#semantic-dom), styles?: [SelectConfig\["styles"\]](/components/select-cn#semantic-dom) }, Select, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `slider`: { className?: string, style?: React.CSSProperties, classNames?: [SliderProps\["classNames"\]](/components/slider-cn#semantic-dom), styles?: [SliderProps\["styles"\]](/components/slider-cn#semantic-dom) }, Slider, Version 5.7.0, `classNames`  `styles`: 5.23.0.
- `switch`: { className?: string, style?: React.CSSProperties, classNames?: [SwitchStyleConfig\["classNames"\]](/components/switch-cn#semantic-dom), styles?: [SwitchStyleConfig\["styles"\]](/components/switch-cn#semantic-dom) }, Switch, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `space`: { size: `small` | `middle` | `large` | `number`, className?: string, style?: React.CSSProperties, classNames?: [SpaceProps\["classNames"\]](/components/space-cn#semantic-dom), styles?: [SpaceProps\["styles"\]](/components/space-cn#semantic-dom) }, Space, [Space](/components/space-cn), Version 5.6.0.
- `splitter`: { className?: string, style?: React.CSSProperties, classNames?:[Splitter\["classNames"\]](/components/splitter-cn#semantic-dom), styles?: [Splitter\["styles"\]](/components/splitter-cn#semantic-dom) }, Splitter, Version 5.21.0.
- `spin`: { className?: string, style?: React.CSSProperties, indicator?: React.ReactElement, classNames?:[SpinConfig\["classNames"\]](/components/spin-cn#semantic-dom), styles?: [SpinConfig\["styles"\]](/components/spin-cn#semantic-dom) }, Spin, Version 5.7.0, `indicator`: 5.20.0, `classNames`  `styles`: 6.0.0.
- `statistic`: { className?: string, style?: React.CSSProperties, classNames?: [StatisticProps\["classNames"\]](/components/statistic-cn#semantic-dom), styles?: [StatisticProps\["styles"\]](/components/statistic-cn#semantic-dom) }, Statistic, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `steps`: { className?: string, style?: React.CSSProperties, classNames?:[StepsConfig\["classNames"\]](/components/steps#semantic-dom), styles?: [StepsConfig\["styles"\]](/components/steps#semantic-dom) }, Steps .
- `table`: { className?: string, style?: React.CSSProperties, expandable?: { expandIcon?: props => React.ReactNode }, classNames?: [TableProps\["classNames"\]](/components/table-cn#semantic-dom), styles?: [TableProps\["styles"\]](/components/table-cn#semantic-dom) }, Table .
- `tabs`: { className?: string, style?: React.CSSProperties, indicator?: { size?: GetIndicatorSize, align?: `start` | `center` | `end` }, moreIcon?: ReactNode, addIcon?: ReactNode, removeIcon?: ReactNode, classNames?: [TabsConfig\["classNames"\]](/components/tabs-cn#semantic-dom), styles?: [TabsConfig\["styles"\]](/components/tabs-cn#semantic-dom) }, Tabs, Version 5.7.0, `moreIcon` and `addIcon`: 5.14.0, `removeIcon`: 5.15.0, `classNames`  `styles`: 6.0.0.
- `tag`: { className?: string, style?: React.CSSProperties, closeIcon?: React.ReactNode, classNames?: [TagProps\["classNames"\]](/components/tag-cn#semantic-dom), styles?: [TagProps\["styles"\]](/components/tag-cn#semantic-dom) }, Tag, Version 5.7.0, closeIcon: 5.14.0, `classNames`  `styles`: 6.0.0.
- `timeline`: { className?: string, style?: React.CSSProperties, classNames?: [TimelineConfig\["classNames"\]](/components/timeline-cn#semantic-dom), styles?: [TimelineConfig\["styles"\]](/components/timeline-cn#semantic-dom) }, Timeline, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `timePicker`: { className?: string, style?: React.CSSProperties, classNames?: [TimePickerConfig\["classNames"\]](/components/time-picker-cn#semantic-dom), styles?: [TimePickerConfig\["styles"\]](/components/time-picker-cn#semantic-dom) }, TimePicker, Version 5.7.0.
- `tour`: { closeIcon?: React.ReactNode, className?: string, style?: React.CSSProperties, classNames?: [TourProps\["classNames"\]](/components/tour-cn#semantic-dom), styles?: [TourProps\["styles"\]](/components/tour-cn#semantic-dom) }, Tour, Version 5.14.0, `classNames`、`styles`、`className`、`style`: 6.0.0.
- `tooltip`: { className?: string, style?: React.CSSProperties, classNames?:[Tooltip\["classNames"\]](/components/tooltip-cn#semantic-dom), styles?: [Tooltip\["styles"\]](/components/tooltip-cn#semantic-dom), arrow: boolean | { pointAtCenter: boolean }, unique?: boolean, trigger?: [Tooltip\["trigger"\]](/components/tooltip-cn#api)}, Tooltip, Version `trigger`: 6.1.0.
- `popover`: { className?: string, style?: React.CSSProperties, classNames?:[Popover\["classNames"\]](/components/popover-cn#semantic-dom), styles?: [Popover\["styles"\]](/components/popover-cn#semantic-dom), arrow: boolean | { pointAtCenter: boolean }, trigger?: [Popover\["trigger"\]](/components/popover-cn#api)}, Popover, Version 5.23.0, `arrow`: 6.0.0, `trigger`: 6.1.0.
- `popconfirm`: { className?: string, style?: React.CSSProperties, classNames?:[Popconfirm\["classNames"\]](/components/popconfirm-cn#semantic-dom), styles?: [Popconfirm\["styles"\]](/components/popconfirm-cn#semantic-dom), arrow: boolean | { pointAtCenter: boolean }, trigger?: [Popconfirm\["trigger"\]](/components/popconfirm-cn#api)}, Popconfirm, Version 5.23.0, `arrow`: 6.0.0, `trigger`: 6.1.0.
- `qrcode`: { className?: string, style?: React.CSSProperties, classNames?:[QRCode\["classNames"\]](/components/qr-code-cn#semantic-dom), styles?: [QRCode\["styles"\]](/components/qr-code-cn#semantic-dom) }, QRCode .
- `transfer`: { className?: string, style?: React.CSSProperties, classNames?: [TransferConfig\["classNames"\]](/components/transfer-cn#semantic-dom), styles?: [TransferConfig\["styles"\]](/components/transfer-cn#semantic-dom), selectionsIcon?: React.ReactNode }, Transfer .
- `tree`: { className?: string, style?: React.CSSProperties, classNames?: [TreeConfig\["classNames"\]](/components/tree-cn#semantic-dom), styles?: [TreeConfig\["styles"\]](/components/tree-cn#semantic-dom) }, Tree, Version 5.7.0, `classNames`  `styles`: 6.0.0.
- `treeSelect`: { className?: string, style?: React.CSSProperties, classNames?: [TreeSelectConfig\["classNames"\]](/components/tree-select-cn#semantic-dom), styles?: [TreeSelectConfig\["styles"\]](/components/tree-select-cn#semantic-dom), switcherIcon?: [TreeSelect\["switcherIcon"\]](/components/tree-select-cn#api)}, TreeSelect .
- `typography`: { className?: string, style?: React.CSSProperties }, Typography, Version 5.7.0.
- `upload`: { className?: string, style?: React.CSSProperties, classNames?:[UploadConfig\["classNames"\]](/components/upload-cn#semantic-dom), styles?: [UploadConfig\["styles"\]](/components/upload-cn#semantic-dom), customRequest?: [Upload\["customRequest"\]](/components/upload#api) }, Upload, Version 5.7.0, `customRequest`: 5.27.0, `classNames`  `styles`: 6.0.0.
- `wave`: { disabled?: boolean, showEffect?: (node: HTMLElement, info: { className, token, component }) => void }, Version 5.8.0.

## Methods

No public methods.

## Usage Recommendations

Use ConfigProvider to provide a uniform configuration support for components.

## Example Code

```tsx
import { Button, ConfigProvider, DatePicker, Space, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';

import 'dayjs/locale/zh-cn';

const App: React.FC = () => (
  <>
    <ConfigProvider locale={zhCN}>
      <Space>
        <DatePicker />
        <Button type="primary">Text</Button>
      </Space>
    </ConfigProvider>

    <ConfigProvider locale={enUS}>
      <Space>
        <DatePicker />
        <Button type="primary">Button</Button>
      </Space>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b', borderRadius: 8, }, }}
    >
      <Button type="primary">Custom Theme</Button>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, }}
    >
      <div style={{ background: '#141414', padding: 24 }}>
        <Button type="primary">Dark Theme</Button>
      </div>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        algorithm: theme.compactAlgorithm, }}
    >
      <Button type="primary">Compact Theme</Button>
    </ConfigProvider>

    <ConfigProvider componentSize="small">
      <Space>
        <Button type="primary">Small Button</Button>
        <DatePicker />
      </Space>
    </ConfigProvider>

    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: '#00b96b', algorithm: true, }, Input: {
            colorPrimary: '#eb2f96', }, }, }}
    >
      <Space>
        <Button type="primary">Button</Button>
        <Input placeholder="Input" />
      </Space>
    </ConfigProvider>

    <ConfigProvider direction="rtl">
      <Button type="primary">RTL Button</Button>
    </ConfigProvider>
  </>
);
```

## Result

Renders a ConfigProvider component.

## References
- Component docs: `https://ant.design/components/config-provider` — use for API details, defaults, and official examples.