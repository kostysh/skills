# Image — Preview-able image.

## Overview

Preview-able image.

Note: props wrapped in `~~` are deprecated. Use the replacement noted in the description.

## When To Use

- When you need to display pictures.
- Display when loading a large image or fault tolerant handling when loading fail.
## Input Fields

### Image Props

#### Required

- No required properties.

#### Optional

- `alt`: string, Image description.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `fallback`: string, Fallback URL when load fails.
- `height`: string | number, Image height.
- `placeholder`: ReactNode, Loading placeholder; if true, uses default placeholder.
- `preview`: boolean | [PreviewType](#previewtype), Preview configuration; set to false to disable. Default true.
- `src`: string, Image URL.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `width`: string | number, Image width.
- `onError`: (event: Event) => void, Callback when loading error occurs.

### PreviewType Props

#### Required

- No required properties.

#### Optional

- `actionsRender`: (originalNode: React.ReactElement, info: ToolbarRenderInfoType) => React.ReactNode, Custom toolbar render.
- `closeIcon`: React.ReactNode, Custom close icon.
- `cover`: React.ReactNode | [CoverConfig](#coverconfig), Custom preview mask. Version CoverConfig support after v6.0.
- `~~destroyOnClose~~`: boolean, Destroy child elements on preview close (removed, no longer supported). Default false Deprecated.
- `~~forceRender~~`: boolean, Force render preview image (removed, no longer supported) Deprecated.
- `getContainer`: string | HTMLElement | (() => HTMLElement) | false, Specify container for preview mounting; still full screen; false mounts at current location.
- `imageRender`: (originalNode: React.ReactElement, info: { transform: [TransformType](#transformtype), image: [ImgInfo](#imginfo) }) => React.ReactNode, Custom preview content.
- `mask`: boolean | { enabled?: boolean, blur?: boolean }, preview mask effect. Default true.
- `~~maskClassName~~`: string, Thumbnail mask class name; please use 'classNames.cover' instead.
- `maxScale`: number, Maximum zoom scale. Default 50.
- `minScale`: number, Minimum zoom scale. Default 1.
- `movable`: boolean, Whether it is movable. Default true.
- `open`: boolean, Whether to display preview.
- `rootClassName`: string, Root DOM class name for preview; applies to both image and preview wrapper.
- `scaleStep`: number, Each step's zoom multiplier is 1 + scaleStep. Default 0.5.
- `src`: string, Custom preview src.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties>, Custom semantic structure styles.
- `~~toolbarRender~~`: (originalNode: React.ReactElement, info: Omit<ToolbarRenderInfoType, 'current' | 'total'>) => React.ReactNode, Custom toolbar; please use 'actionsRender' instead.
- `~~visible~~`: boolean, Whether to show; please use 'open' instead.
- `onOpenChange`: (visible: boolean) => void, Callback when preview open state changes.
- `onTransform`: { transform: [TransformType](#transformtype), action: [TransformAction](#transformaction) }, Callback for preview transform changes.
- `~~onVisibleChange~~`: (visible: boolean, prevVisible: boolean) => void, Callback when 'visible' changes; please use 'onOpenChange' instead.

### PreviewGroup Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `fallback`: string, Fallback URL for load error.
- `items`: string[] | { src: string, crossOrigin: string, ... }[], Array of preview items.
- `preview`: boolean | [PreviewGroupType](#previewgrouptype), Preview configuration; disable by setting to false. Default true.

### PreviewGroupType Props

#### Required

- No required properties.

#### Optional

- `actionsRender`: (originalNode: React.ReactElement, info: ToolbarRenderInfoType) => React.ReactNode, Custom toolbar render.
- `closeIcon`: React.ReactNode, Custom close icon.
- `countRender`: (current: number, total: number) => React.ReactNode, Custom preview count render.
- `current`: number, Index of the current preview image.
- `~~forceRender~~`: boolean, Force render preview image (removed, no longer supported) Deprecated.
- `getContainer`: string | HTMLElement | (() => HTMLElement) | false, Specify container for preview mounting; still full screen; false mounts at current location.
- `imageRender`: (originalNode: React.ReactElement, info: { transform: [TransformType](#transformtype), image: [ImgInfo](#imginfo), current: number }) => React.ReactNode, Custom preview content.
- `mask`: boolean | { enabled?: boolean, blur?: boolean }, preview mask effect. Default true.
- `~~maskClassName~~`: string, Thumbnail mask class name; please use 'classNames.cover' instead.
- `minScale`: number, Minimum zoom scale. Default 1.
- `maxScale`: number, Maximum zoom scale. Default 50.
- `movable`: boolean, Whether movable. Default true.
- `open`: boolean, Whether to display preview.
- `~~rootClassName~~`: string, Root DOM class name for preview; applies to both image and preview wrapper. Use 'classNames.root' instead.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties>, Custom semantic structure styles.
- `scaleStep`: number, Each step's zoom multiplier is 1 + scaleStep. Default 0.5.
- `~~toolbarRender~~`: (originalNode: React.ReactElement, info: ToolbarRenderInfoType) => React.ReactNode, Custom toolbar; please use 'actionsRender' instead.
- `~~visible~~`: boolean, Whether to show; please use 'open' instead.
- `onOpenChange`: (visible: boolean, info: { current: number }) => void, Callback when preview open state changes, includes current preview index.
- `onChange`: (current: number, prevCurrent: number) => void, Callback when changing preview image.
- `onTransform`: { transform: [TransformType](#transformtype), action: [TransformAction](#transformaction) }, Callback for preview transform changes.
- `~~onVisibleChange~~`: (visible: boolean, prevVisible: boolean, current: number) => void, Callback when 'visible' changes; please use 'onOpenChange' instead.

## Methods

No public methods.

## Usage Recommendations

Use Image to preview-able image.

## Example Code

```tsx
import { Image, Space } from 'antd';

const App: React.FC = () => (
  <Space direction="vertical">
    <Image
      width={200}
      src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
    />

    <Image
      width={200}
      src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
      preview={{
        src: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png', }}
    />

    <Image width={200} src="error.png" fallback="https://via.placeholder.com/200" preview={false} />

    <Image.PreviewGroup
      items={[
        'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg', 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg', ]}
    >
      <Image
        width={200}
        src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
      />
    </Image.PreviewGroup>

    <Image
      width={200}
      src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
      placeholder={
        <Image
          preview={false}
          src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png?x-oss-process=image/blur, r_50, s_50/quality, q_1/resize, m_mfit, h_200, w_200"
          width={200}
        />
      }
    />
  </Space>
);
```

## Result

Renders an Image component.

## References
- Component docs: `https://ant.design/components/image` — use for API details, defaults, and official examples.