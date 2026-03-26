# Watermark — Add specific text or patterns to the page.

## Overview

Add specific text or patterns to the page.

## When To Use

- Use when the page needs to be watermarked to identify the copyright.
- Suitable for preventing information theft.
## Input Fields

### Watermark Props

#### Required

- No required properties.

#### Optional

- `width`: number, The width of the watermark, the default value of `content` is its own width. Default 120.
- `height`: number, The height of the watermark, the default value of `content` is its own height. Default 64.
- `inherit`: boolean, Pass the watermark to the pop-up component such as Modal, Drawer. Default true. Version 5.11.0.
- `rotate`: number, When the watermark is drawn, the rotation Angle, unit `°`. Default -22.
- `zIndex`: number, The z-index of the appended watermark element. Default 9.
- `image`: string, Image source, it is recommended to export 2x or 3x image, high priority (support base64 format).
- `content`: string | string[], Watermark text content.
- `font`: [Font](#font), Text style. Default [Font](#font).
- `gap`: \[number, number\], The spacing between watermarks. Default \[100, 100\].
- `offset`: \[number, number\], The offset of the watermark from the upper left corner of the container. The default is `gap/2`. Default \[gap\[0\]/2, gap\[1\]/2\].
- `onRemove`: `() => void`, Callback when the watermark is removed by DOM mutation. Version 6.0.0.

### Font Props

#### Required

- No required properties.

#### Optional

- `color`: [CanvasFillStrokeStyles.fillStyle](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillStyle), font color. Default rgba(0,0,0,.15).
- `fontSize`: number, font size. Default 16.
- `fontWeight`: `normal` | `lighter` | `bold` | `bolder` | number, font weight. Default normal.
- `fontFamily`: string, font family. Default sans-serif.
- `fontStyle`: `none` | `normal` | `italic` | `oblique`, font style. Default normal.
- `textAlign`: [CanvasTextAlign](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/textAlign), specify the text alignment direction. Default `center`. Version 5.10.0.

## Methods

No public methods.

## Usage Recommendations

Use Watermark to add specific text or patterns to the page.

## Example Code

```tsx
import { useState } from 'react';
import { Button, Card, Drawer, Modal, Watermark } from 'antd';

const App: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Watermark content="Ant Design">
        <div style={{ height: 500 }}>Content with watermark</div>
      </Watermark>

      <Watermark content={['Ant Design', 'Happy Working']}>
        <div style={{ height: 500 }}>Content with multi-line watermark</div>
      </Watermark>

      <Watermark
        image="https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*lkAoRbywo0oAAAAAAAAAAAAADrJ8AQ/original"
        width={130}
        height={32}
      >
        <div style={{ height: 500 }}>Content with image watermark</div>
      </Watermark>

      <Watermark
        content="Ant Design"
        font={{ color: 'rgba(0, 0, 0, 0.15)', fontSize: 16 }}
        gap={[200, 200]}
        rotate={-20}
      >
        <div style={{ height: 500 }}>Custom watermark</div>
      </Watermark>

      <Watermark content="Ant Design" inherit>
        <Card title="Card">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        </Card>

        <Modal title="Modal with Watermark" open={modalOpen} onCancel={() => setModalOpen(false)}>
          <p>Modal content with inherited watermark</p>
        </Modal>

        <Drawer
          title="Drawer with Watermark"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <p>Drawer content with inherited watermark</p>
        </Drawer>
      </Watermark>
    </>
  );
};
```

## Result

Renders a Watermark component.

## References
- Component docs: `https://ant.design/components/watermark` — use for API details, defaults, and official examples.