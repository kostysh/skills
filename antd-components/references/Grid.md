# Grid — 24 Grids System.

## Overview

24 Grids System.

## When To Use

- Use Grid to 24 Grids System.
## Input Fields

### Row Props

#### Required

- No required properties.

#### Optional

- `align`: `top` | `middle` | `bottom` | `stretch` | `{[key in 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl']: 'top' | 'middle' | 'bottom' | 'stretch'}`, Vertical alignment. Default `top`. Version object: 4.24.0.
- `gutter`: number | string | object | array, Spacing between grids, could be a [string CSS units](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units) or a object like { xs: 8, sm: 16, md: 24}. Or you can use array to make horizontal and vertical spacing work at the same time `[horizontal, vertical]`. Default 0. Version string: 5.28.0.
- `justify`: `start` | `end` | `center` | `space-around` | `space-between` | `space-evenly` | `{[key in 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl']: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'}`, Horizontal arrangement. Default `start`. Version object: 4.24.0.
- `wrap`: boolean, Auto wrap line. Default true. Version 4.8.0.

### Col Props

#### Required

- No required properties.

#### Optional

- `flex`: string | number, Flex layout style.
- `offset`: number, The number of cells to offset Col from the left. Default 0.
- `order`: number, Raster order. Default 0.
- `pull`: number, The number of cells that raster is moved to the left. Default 0.
- `push`: number, The number of cells that raster is moved to the right. Default 0.
- `span`: number, Raster number of cells to occupy, 0 corresponds to `display: none`. Default none.
- `xs`: number | object, `screen < 576px` and also default setting, could be a `span` value or an object containing above props.
- `sm`: number | object, `screen ≥ 576px`, could be a `span` value or an object containing above props.
- `md`: number | object, `screen ≥ 768px`, could be a `span` value or an object containing above props.
- `lg`: number | object, `screen ≥ 992px`, could be a `span` value or an object containing above props.
- `xl`: number | object, `screen ≥ 1200px`, could be a `span` value or an object containing above props.
- `xxl`: number | object, `screen ≥ 1600px`, could be a `span` value or an object containing above props.

## Methods

No public methods.

## Usage Recommendations

Use Grid to 24 Grids System.

## Example Code

```tsx
import { Col, Row } from 'antd';

const App: React.FC = () => (
  <>
    <Row>
      <Col span={12}>col-12</Col>
      <Col span={12}>col-12</Col>
    </Row>

    <Row gutter={16}>
      <Col span={6}>
        <div>col-6</div>
      </Col>
      <Col span={6}>
        <div>col-6</div>
      </Col>
      <Col span={6}>
        <div>col-6</div>
      </Col>
      <Col span={6}>
        <div>col-6</div>
      </Col>
    </Row>

    <Row gutter={{ xs: 8, sm: 16, md: 24 }}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div>col</div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div>col</div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div>col</div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div>col</div>
      </Col>
    </Row>

    <Row>
      <Col span={8}>col-8</Col>
      <Col span={8} offset={8}>
        col-8 offset-8
      </Col>
    </Row>
  </>
);
```

## Result

Renders a Grid component.

## References
- Component docs: `https://ant.design/components/grid` — use for API details, defaults, and official examples.