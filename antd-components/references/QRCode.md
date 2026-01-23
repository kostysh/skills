# QRCode — Components that can convert text into QR codes, and support custom color and logo.

## Overview

Components that can convert text into QR codes, and support custom color and logo.

## When To Use

- Used when the text needs to be converted into a QR Code.
## Input Fields

### QRCode Props

#### Required

- No required properties.

#### Optional

- `value`: string, scanned text.
- `type`: `canvas | svg`, render type. Default `canvas`. Version 5.6.0.
- `icon`: string, include image url (only image link are supported).
- `size`: number, QRCode size. Default 160.
- `iconSize`: number | { width: number; height: number }, include image size. Default 40. Version 5.19.0.
- `color`: string, QRCode Color. Default `#000`.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `bgColor`: string, QRCode Background Color. Default `transparent`. Version 5.5.0.
- `marginSize`: number, Quiet zone size (in modules). `0` means no margin. Default `0`. Version 6.2.0.
- `bordered`: boolean, Whether has border style. Default `true`.
- `errorLevel`: `'L' | 'M' | 'Q' | 'H' `, Error Code Level. Default `M`.
- `boostLevel`: `boolean`, If enabled, the Error Correction Level of the result may be higher than the specified Error Correction Level. Default true. Version 5.28.0.
- `status`: `active | expired | loading | scanned`, QRCode status. Default `active`. Version scanned: 5.13.0.
- `statusRender`: `(info: [StatusRenderInfo](/components/qr-code-cn#statusrenderinfo)) => React.ReactNode`, custom status render. Version 5.20.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `type`: `canvas | svg`, render type. Default `canvas`. Version 5.6.0.
- `value`: string, scanned text.

## Methods

No public methods.

## Usage Recommendations

Use QRCode to components that can convert text into QR codes, and support custom color and logo.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Input, QRCode, Segmented, Space } from 'antd';

const App: React.FC = () => {
  const [text, setText] = useState('https://ant.design/');
  const [status, setStatus] = useState<'active' | 'expired' | 'loading'>('active');

  return (
    <Space direction="vertical" size="middle">
      <QRCode value="https://ant.design/" />

      <QRCode
        value="https://ant.design/"
        icon="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
      />

      <Space>
        <QRCode value="https://ant.design/" size={80} />
        <QRCode value="https://ant.design/" size={160} />
        <QRCode value="https://ant.design/" size={240} />
      </Space>

      <QRCode value="https://ant.design/" color="#1677ff" bgColor="#f0f0f0" />

      <Space>
        <QRCode value="https://ant.design/" errorLevel="L" />
        <QRCode value="https://ant.design/" errorLevel="H" />
      </Space>

      <Space>
        <Segmented options={['active', 'expired', 'loading']} value={status} onChange={setStatus} />
        <QRCode value="https://ant.design/" status={status} onRefresh={() => setStatus('active')} />
      </Space>

      <Space direction="vertical">
        <Input
          placeholder="Enter text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: 200 }}
        />
        <QRCode value={text || '-'} />
      </Space>

      <Space direction="vertical">
        <QRCode id="myqrcode" value="https://ant.design/" />
        <Button
          type="primary"
          onClick={() => {
            const canvas = document
              .getElementById('myqrcode')
              ?.querySelector<HTMLCanvasElement>('canvas');
            if (canvas) {
              const url = canvas.toDataURL();
              const a = document.createElement('a');
              a.download = 'QRCode.png';
              a.href = url;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          }}
        >
          Download
        </Button>
      </Space>
    </Space>
  );
};
```

## Result

Renders a QRCode component.

## References
- Component docs: `https://ant.design/components/qr-code` — use for API details, defaults, and official examples.