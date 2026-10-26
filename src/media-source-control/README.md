# MediaSourceControl

Inspector panels for choosing a block's media: an image, a self-hosted video (with poster and captions), or a YouTube video, plus playback settings. It warns when a video has no captions file and keeps autoplaying video muted.

## Usage

Place it inside `InspectorControls`. It edits a flat media object and reports each change as a partial object to merge into it:

```jsx
import { InspectorControls } from "@wordpress/block-editor";
import { MediaSourceControl } from "@reaktiv/editor-components";

<InspectorControls>
	<MediaSourceControl
		media={attributes.media}
		onChange={(changes) =>
			setAttributes({ media: { ...attributes.media, ...changes } })
		}
		allowImageSource
	/>
</InspectorControls>;
```

## The `media` object

| Key                    | Type      | Description |
| ---------------------- | --------- | ----------- |
| `type`                 | `string`  | `"image"` or `"video"`. Only used with `allowImageSource`; unset means `"image"`. |
| `imageId`, `imageUrl`  | `number`, `string` | The image, for the `"image"` type. |
| `source`               | `string`  | `"self-hosted"` (default) or `"youtube"`. |
| `youtubeUrl`           | `string`  | The YouTube URL, for the `"youtube"` source. |
| `videoId`, `videoUrl`  | `number`, `string` | The self-hosted video. |
| `posterId`, `posterUrl` | `number`, `string` | The poster image shown before the video plays. |
| `captionsId`, `captionsUrl` | `number`, `string` | A WebVTT (`.vtt`) captions file. |
| `title`                | `string`  | The video's accessible name. |
| `autoplay`, `muted`, `loop`, `controls` | `boolean` | Playback settings. Turning on `autoplay` also turns on `muted`. |

The component only edits these values. Rendering the media, and any defaults for missing keys, are up to the block.

## Props

| Prop               | Type       | Default | Description |
| ------------------ | ---------- | ------- | ----------- |
| `media`            | `object`   |         | The stored media, as above. |
| `onChange`         | `function` |         | Called with a partial `media` object of the changed keys. |
| `allowImageSource` | `boolean`  | `false` | Adds a media type toggle and an image picker. Without it the control is video only. |
| `panelPrefix`      | `string`   |         | Prefix for the panel titles, such as `"Desktop"`, to tell several instances in one block apart. |
| `backgroundVideo`  | `boolean`  | `false` | Limits video to a self-hosted background. The source, title, captions, and playback panels are hidden, so the block should force the muted, looping playback itself. |
