# Lightbox

A modal that shows images, videos, or embeds one at a time, with previous and next buttons, dots, arrow-key navigation, and a caption. It works in the editor and on the front end, since it's plain React on top of the `Modal` component.

## Usage

```jsx
import { Lightbox } from "@reaktiv/editor-components";

<Lightbox
	isOpen={isOpen}
	items={images.map((image) => ({
		content: <img src={image.url} alt={image.alt} />,
		caption: image.caption,
	}))}
	initialIndex={clickedIndex}
	label="Photo gallery"
	onClose={() => setIsOpen(false)}
/>;
```

The lightbox mounts fresh each time it opens, so the current item resets to `initialIndex`. It doesn't find media on the page: build the `items` from your block's data. Navigation wraps around at either end, and the arrow keys follow the text direction. Slides that aren't showing are hidden from keyboard and screen readers, so an embedded player in another slide isn't tabbable.

`content` can be any node. Images and videos are scaled to fit, and an `iframe` gets a 16/9 aspect ratio and the full width, which you can override with its own `style`.

On the front end, import the component from your view script so its stylesheet is bundled with it. It uses the `--wp-components-color-accent` custom property when present, and falls back to the WordPress admin blue.

## Props

| Prop           | Type       | Default          | Description |
| -------------- | ---------- | ---------------- | ----------- |
| `isOpen`       | `boolean`  |                  | Renders the lightbox when `true`. |
| `onClose`      | `function` |                  | Called when the lightbox is dismissed. |
| `items`        | `object[]` | `[]`             | `{ content, caption }` for each item. `content` is any node; `caption` is an optional node shown beside it. Previous, next, and dots are hidden with a single item. |
| `initialIndex` | `number`   | `0`              | Index of the item shown first. |
| `label`        | `string`   | "Media viewer"   | Accessible name for the dialog. |
| `className`    | `string`   |                  | Extra class for the dialog. |
