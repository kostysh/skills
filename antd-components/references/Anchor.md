# Anchor — Hyperlinks to scroll on one page.

## Overview

Hyperlinks to scroll on one page.

## When To Use

- For displaying anchor hyperlinks on page and jumping between them.
## Input Fields

### Anchor Props

#### Required

- No required properties.

#### Optional

- `affix`: boolean | Omit<AffixProps, 'offsetTop' | 'target' | 'children'>, Fixed mode of Anchor. Default true. Version object: 5.19.0.
- `bounds`: number, Bounding distance of anchor area. Default 5.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `getContainer`: () => HTMLElement, Scrolling container. Default () => window.
- `getCurrentAnchor`: (activeLink: string) => string, Customize the anchor highlight.
- `offsetTop`: number, Pixels to offset from top when calculating position of scroll. Default 0.
- `showInkInFixed`: boolean, Whether show ink-square when `affix={false}`. Default false.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `targetOffset`: number, Anchor scroll offset, default as `offsetTop`, [example](#anchor-demo-targetoffset).
- `onChange`: (currentActiveLink: string) => void, Listening for anchor link change.
- `onClick`: (e: MouseEvent, link: object) => void, Set the handler to handle `click` event.
- `items`: { key, href, title, target, children }\[] [see](#anchoritem), Data configuration option content, support nesting through children. Version 5.1.0.
- `direction`: `vertical` | `horizontal`, Set Anchor direction. Default `vertical`. Version 5.2.0.
- `replace`: boolean, Replace items' href in browser history instead of pushing it. Default false. Version 5.7.0.

### AnchorItem Props

#### Required

- No required properties.

#### Optional

- `key`: string | number, The unique identifier of the Anchor Link.
- `href`: string, The target of hyperlink.
- `target`: string, Specifies where to display the linked URL.
- `title`: ReactNode, The content of hyperlink.
- `children`: [AnchorItem](#anchoritem)\[], Nested Anchor Link, `Attention: This attribute does not support horizontal orientation`.
- `replace`: boolean, Replace item href in browser history instead of pushing it. Default false. Version 5.7.0.

### Link Props

#### Required

- No required properties.

#### Optional

- `href`: string, The target of hyperlink.
- `target`: string, Specifies where to display the linked URL.
- `title`: ReactNode, The content of hyperlink.

## Methods

No public methods.

## Usage Recommendations

Use Anchor to hyperlinks to scroll on one page.

## Example Code

```tsx
import { Anchor, Col, Row } from 'antd';
import type { AnchorProps } from 'antd';

const items: AnchorProps['items'] = [
  {
    key: 'part-1', href: '#part-1', title: 'Part 1', }, {
    key: 'part-2', href: '#part-2', title: 'Part 2', }, {
    key: 'part-3', href: '#part-3', title: 'Part 3', children: [
      {
        key: 'part-3-1', href: '#part-3-1', title: 'Part 3-1', }, {
        key: 'part-3-2', href: '#part-3-2', title: 'Part 3-2', }, ], }, ];

const App: React.FC = () => (
  <Row>
    <Col span={16}>
      <div id="part-1" style={{ height: '100vh' }}>
        Part 1
      </div>
      <div id="part-2" style={{ height: '100vh' }}>
        Part 2
      </div>
      <div id="part-3" style={{ height: '100vh' }}>
        Part 3
      </div>
      <div id="part-3-1" style={{ height: '50vh' }}>
        Part 3-1
      </div>
      <div id="part-3-2" style={{ height: '50vh' }}>
        Part 3-2
      </div>
    </Col>
    <Col span={8}>
      <Anchor items={items} />

      <Anchor direction="horizontal" items={items} />

      <Anchor affix={false} items={items} />

      <Anchor getContainer={() => document.getElementById('custom-container')!} items={items} />

      <Anchor targetOffset={60} items={items} />
    </Col>
  </Row>
);
```

## Result

Renders an Anchor component.

## References
- Component docs: `https://ant.design/components/anchor` — use for API details, defaults, and official examples.