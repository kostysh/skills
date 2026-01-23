# Carousel — A set of carousel areas.

## Overview

A set of carousel areas.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When there is a group of content on the same level.
- When there is insufficient content space, it can be used to save space in the form of a revolving door.
- Commonly used for a group of pictures/cards.
## Input Fields

### Carousel Props

#### Required

- No required properties.

#### Optional

- `arrows`: boolean, Whether to show switch arrows. Default false. Version 5.17.0.
- `autoplay`: boolean | { dotDuration?: boolean }, Whether to scroll automatically, you can specify `autoplay={{ dotDuration: true }}` to display the progress bar. Default false. Version dotDuration: 5.24.0.
- `autoplaySpeed`: number, Delay between each auto scroll (in milliseconds). Default 3000.
- `adaptiveHeight`: boolean, Adjust the slide's height automatically. Default false.
- `dotPlacement`: string, The position of the dots, which can be one of `top` `bottom` `start` `end`. Default `bottom`.
- `~~dotPosition~~`: string, The position of the dots, which can be one of `top` `bottom` `left` `right` `start` `end`, Please use `dotPlacement` instead. Default `bottom`.
- `dots`: boolean | { className?: string }, Whether to show the dots at the bottom of the gallery, `object` for `dotsClass`. Default true.
- `draggable`: boolean, Enable scrollable via dragging on desktop. Default false.
- `fade`: boolean, Whether to use fade transition. Default false.
- `infinite`: boolean, Infinitely wrap around contents. Default true.
- `speed`: number, Animation speed in milliseconds. Default 500.
- `easing`: string, Transition interpolation function name. Default `linear`.
- `effect`: `scrollx` | `fade`, Transition effect. Default `scrollx`.
- `afterChange`: (current: number) => void, Callback function called after the current index changes.
- `beforeChange`: (current: number, next: number) => void, Callback function called before the current index changes.
- `waitForAnimate`: boolean, Whether to wait for the animation when switching. Default false.

## Methods

- `goTo(slideNumber, dontAnimate)`:, dontAnimate = true, - `next()`:
- `prev()`:

## Usage Recommendations

Use Carousel to a set of carousel areas.

## Example Code

```tsx
import { useRef } from 'react';
import { Button, Carousel, Space } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';

const contentStyle: React.CSSProperties = {
  height: '160px', color: '#fff', lineHeight: '160px', textAlign: 'center', background: '#364d79', };

const App: React.FC = () => {
  const carouselRef = useRef<CarouselRef>(null);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Carousel>
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
        <div>
          <h3 style={contentStyle}>3</h3>
        </div>
        <div>
          <h3 style={contentStyle}>4</h3>
        </div>
      </Carousel>

      <Carousel autoplay>
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
        <div>
          <h3 style={contentStyle}>3</h3>
        </div>
      </Carousel>

      <Carousel effect="fade">
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
      </Carousel>

      <Carousel arrows>
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
      </Carousel>

      <Carousel ref={carouselRef}>
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
      </Carousel>
      <Space>
        <Button onClick={() => carouselRef.current?.prev()}>Prev</Button>
        <Button onClick={() => carouselRef.current?.next()}>Next</Button>
        <Button onClick={() => carouselRef.current?.goTo(0)}>Go to 1</Button>
      </Space>
    </Space>
  );
};
```

## Result

Renders a Carousel component.

## References
- Component docs: `https://ant.design/components/carousel` — use for API details, defaults, and official examples.