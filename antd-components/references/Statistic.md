# Statistic — Display statistic number.

## Overview

Display statistic number.

## When To Use

- When want to highlight some data.
- When want to display statistic data with description.
## Input Fields

### Statistic Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the Statistic component. Supports object or function.
- `decimalSeparator`: string, The decimal separator. Default `.`.
- `formatter`: (value) => ReactNode, Customize value display logic.
- `groupSeparator`: string, Group separator. Default `,`.
- `loading`: boolean, Loading status of Statistic. Default false. Version 4.8.0.
- `precision`: number, The precision of input value.
- `prefix`: ReactNode, The prefix node of value.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the Statistic component. Supports object or function.
- `suffix`: ReactNode, The suffix node of value.
- `title`: ReactNode, Display title.
- `value`: number, Set target countdown time.
- `valueStyle`: CSSProperties, Set value section style.

### Statistic.Countdown <Badge type="error">Deprecated</Badge>

#### Required

- No required properties.

#### Optional

- `format`: string, Format as [dayjs](https://day.js.org/). Default `HH:mm:ss`.
- `prefix`: ReactNode, The prefix node of value.
- `suffix`: ReactNode, The suffix node of value.
- `title`: ReactNode, Display title.
- `value`: number, Set target countdown time.
- `valueStyle`: CSSProperties, Set value section style.
- `onFinish`: () => void, Trigger when time's up, only to be called when type is `countdown`.
- `onChange`: (value: number) => void, Trigger when time's changing.

### Statistic.Timer <Badge>5.25.0+</Badge>

#### Required

- No required properties.

#### Optional

- `type`: `countdown` `countup`, time counter down or up.
- `format`: string, Format as [dayjs](https://day.js.org/). Default `HH:mm:ss`.
- `prefix`: ReactNode, The prefix node of value.
- `suffix`: ReactNode, The suffix node of value.
- `title`: ReactNode, Display title.
- `value`: number, Set target countdown time.
- `valueStyle`: CSSProperties, Set value section style.
- `onFinish`: () => void, Trigger when time's up, only to be called when type is `countdown`.
- `onChange`: (value: number) => void, Trigger when time's changing.

## Methods

No public methods.

## Usage Recommendations

Use Statistic to display statistic number.

## Example Code

```tsx
import { ArrowDownOutlined, ArrowUpOutlined, LikeOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic } from 'antd';

const { Countdown } = Statistic;
const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2; // 2 days

const App: React.FC = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Row gutter={16}>
      <Col span={12}>
        <Statistic title="Active Users" value={112893} />
      </Col>
      <Col span={12}>
        <Statistic title="Account Balance (CNY)" value={112893} precision={2} />
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Statistic title="Feedback" value={1128} prefix={<LikeOutlined />} />
      </Col>
      <Col span={12}>
        <Statistic title="Unmerged" value={93} suffix="/ 100" />
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Card bordered={false}>
          <Statistic
            title="Active"
            value={11.28}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
            suffix="%"
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card bordered={false}>
          <Statistic
            title="Idle"
            value={9.3}
            precision={2}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ArrowDownOutlined />}
            suffix="%"
          />
        </Card>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Countdown title="Countdown" value={deadline} onFinish={() => console.log('finished!')} />
      </Col>
      <Col span={12}>
        <Countdown title="Day Level" value={deadline} format="D Text H Text m Text s Text" />
      </Col>
    </Row>
  </Space>
);
```

## Result

Renders a Statistic component.

## References
- Component docs: `https://ant.design/components/statistic` — use for API details, defaults, and official examples.