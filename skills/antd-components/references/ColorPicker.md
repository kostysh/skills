# ColorPicker — Used for color selection.

## Overview

Used for color selection.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- Used when the user needs to make a customized color selection.
## Input Fields

### ColorPicker Props

#### Required

- No required properties.

#### Optional

- `allowClear`: boolean, Allow clearing color selected. Default false.
- `arrow`: `boolean | { pointAtCenter: boolean }`, Configuration for popup arrow. Default true.
- `children`: React.ReactNode, Trigger of ColorPicker.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `defaultValue`: [ColorType](#colortype), Default value of color.
- `defaultFormat`: `rgb` | `hex` | `hsb`, Default format of color. Default `hex`. Version 5.9.0.
- `disabled`: boolean, Disable ColorPicker.
- `disabledAlpha`: boolean, Disable Alpha. Version 5.8.0.
- `disabledFormat`: boolean, Disable format of color. Version 5.22.0.
- `~~destroyTooltipOnHide~~`: `boolean`, Whether destroy dom when close. Default false. Version 5.7.0 Deprecated.
- `destroyOnHidden`: `boolean`, Whether destroy dom when close. Default false. Version 5.25.0.
- `format`: `rgb` | `hex` | `hsb`, Format of color.
- `mode`: `'single' | 'gradient' | ('single' | 'gradient')[]`, Configure single or gradient color. Default `single`. Version 5.20.0.
- `open`: boolean, Whether to show popup.
- `presets`: [PresetColorType](#presetcolortype), Preset colors.
- `placement`: The design of the [placement](/components/tooltip/#api) parameter is the same as the `Tooltips` component., Placement of popup. Default `bottomLeft`.
- `panelRender`: `(panel: React.ReactNode, extra: { components: { Picker: FC; Presets: FC } }) => React.ReactNode`, Custom Render Panel. Version 5.7.0.
- `showText`: boolean | `(color: Color) => React.ReactNode`, Show color text. Version 5.7.0.
- `size`: `large` | `middle` | `small`, Setting the trigger size. Default `middle`. Version 5.7.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `trigger`: `hover` | `click`, ColorPicker trigger mode. Default `click`.
- `value`: [ColorType](#colortype), Value of color.
- `onChange`: `(value: Color, css: string) => void`, Callback when `value` is changed.
- `onChangeComplete`: `(value: Color) => void`, Called when color pick ends. Will not change the display color when `value` controlled by `onChangeComplete`. Version 5.7.0.
- `onFormatChange`: `(format: 'hex' | 'rgb' | 'hsb') => void`, Callback when `format` is changed.
- `onOpenChange`: `(open: boolean) => void`, Callback when `open` is changed.
- `onClear`: `() => void`, Called when clear. Version 5.6.0.

### Color Props

#### Required

- No required properties.

#### Optional

- `toCssString`: `() => string`, Convert to CSS support format. Default 5.20.0. Version 5.20.0.
- `toHex`: `() => string`, Convert to `hex` format characters, the return type like: `1677ff`.
- `toHexString`: `() => string`, Convert to `hex` format color string, the return type like: `#1677ff`.
- `toHsb`: `() => ({ h: number, s: number, b: number, a number })`, Convert to `hsb` object.
- `toHsbString`: `() => string`, Convert to `hsb` format color string, the return type like: `hsb(215, 91%, 100%)`.
- `toRgb`: `() => ({ r: number, g: number, b: number, a number })`, Convert to `rgb` object.
- `toRgbString`: `() => string`, Convert to `rgb` format color string, the return type like: `rgb(22, 119, 255)`.

## Methods

No public methods.

## Usage Recommendations

Use ColorPicker to used for color selection.

## Example Code

```tsx
import { useState } from 'react';
import { ColorPicker, Space, theme } from 'antd';
import type { ColorPickerProps, GetProp } from 'antd';

type Color = GetProp<ColorPickerProps, 'value'>;

const App: React.FC = () => {
  const [color, setColor] = useState<Color>('#1677ff');
  const { token } = theme.useToken();

  const presets: ColorPickerProps['presets'] = [
    {
      label: 'Recommended', colors: [
        '#000000', '#ffffff', '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16', ], }, {
      label: 'Recent', colors: ['#F5222D', '#FA8C16', '#8BBB11', '#52C41A', '#13A8A8'], }, ];

  return (
    <Space direction="vertical">
      <ColorPicker />

      <ColorPicker defaultValue="#1677ff" />

      <ColorPicker value={color} onChange={setColor} />

      <ColorPicker showText />
      <ColorPicker showText={(color) => <span>Custom ({color.toHexString()})</span>} />

      <Space>
        <ColorPicker size="small" />
        <ColorPicker />
        <ColorPicker size="large" />
      </Space>

      <ColorPicker disabledAlpha />

      <ColorPicker presets={presets} />

      <ColorPicker format="hex" />
      <ColorPicker format="rgb" />
      <ColorPicker format="hsb" />

      <ColorPicker allowClear />

      <ColorPicker disabled />

      <ColorPicker trigger="hover" />

      <ColorPicker mode={['single', 'gradient']} />
    </Space>
  );
};
```

## Result

Renders a ColorPicker component.

## References
- Component docs: `https://ant.design/components/color-picker` — use for API details, defaults, and official examples.