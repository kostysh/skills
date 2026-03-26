# Affix — Stick an element to the viewport.

## Overview

Stick an element to the viewport.

## When To Use

- On longer web pages, it's helpful to stick component into the viewport. This is common for menus and actions.
- Please note that Affix should not cover other content on the page, especially when the size of the viewport is small.
## Input Fields

### Affix Props

#### Required

- No required properties.

#### Optional

- `offsetBottom`: number, Offset from the bottom of the viewport (in pixels).
- `offsetTop`: number, Offset from the top of the viewport (in pixels). Default 0.
- `target`: () => HTMLElement, Specifies the scrollable area DOM node. Default () => window.
- `onChange`: (affixed?: boolean) => void, Callback for when Affix state is changed.

## Methods

No public methods.

## Usage Recommendations

Use Affix to stick an element to the viewport.

## Example Code

```tsx
import { useState } from 'react';
import { Affix, Button } from 'antd';

const App: React.FC = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <Affix offsetTop={10}>
        <Button type="primary">Affix top</Button>
      </Affix>

      <Affix offsetBottom={10}>
        <Button type="primary">Affix bottom</Button>
      </Affix>

      <Affix offsetTop={120} onChange={(affixed) => console.log(affixed)}>
        <Button>120px to affix top</Button>
      </Affix>

      <div ref={setContainer} style={{ height: 100, overflow: 'auto' }}>
        <div style={{ height: 1000 }}>
          <Affix target={() => container!} offsetTop={10}>
            <Button type="primary">Fixed in container</Button>
          </Affix>
        </div>
      </div>
    </>
  );
};
```

## Result

Renders an Affix component.

## References
- Component docs: `https://ant.design/components/affix` — use for API details, defaults, and official examples.