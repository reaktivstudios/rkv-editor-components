# ViewportMediaControls

[`MediaSourceControl`](../media-source-control/README.md) panels for media that differs by viewport: desktop media, plus optional tablet and mobile media that otherwise fall back to the next larger viewport.

## Usage

Place it inside `InspectorControls`:

```jsx
import { InspectorControls } from "@wordpress/block-editor";
import { ViewportMediaControls } from "@reaktiv/editor-components";

<InspectorControls>
	<ViewportMediaControls
		value={{
			desktop: attributes.desktopMedia,
			tablet: attributes.tabletMedia,
			mobile: attributes.mobileMedia,
		}}
		onChange={({ desktop, tablet, mobile }) =>
			setAttributes({
				desktopMedia: desktop,
				tabletMedia: tablet,
				mobileMedia: mobile,
			})
		}
	/>
</InspectorControls>;
```

A viewport counts as overridden when its media has a `type`. Turning an override on starts it from the exported `DEFAULT_MEDIA`, and turning it off resets it to `{}`. Choosing which asset to show at each viewport is up to the block, and the fallback order is desktop, then tablet, then mobile.

## Props

| Prop              | Type       | Default | Description |
| ----------------- | ---------- | ------- | ----------- |
| `value`           | `object`   |         | `{ desktop, tablet, mobile }`. Each is a [`media` object](../media-source-control/README.md#the-media-object). |
| `onChange`        | `function` |         | Called with the whole next `{ desktop, tablet, mobile }` value. |
| `backgroundVideo` | `boolean`  | `false` | Passed to `MediaSourceControl`. |

## DEFAULT_MEDIA

```js
import { DEFAULT_MEDIA } from "@reaktiv/editor-components";
```

The empty media object: an image type with no files, self-hosted source, and `controls` on. Use it as the attribute default.
