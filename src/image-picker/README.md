# ImagePicker

An image field: a preview of the chosen image that opens the media library, with Replace and Remove actions once an image is set. Stores the attachment ID.

## Usage

```jsx
import { ImagePicker } from "@reaktiv/editor-components";

<ImagePicker
	label="Background image"
	value={attributes.imageId}
	onChange={(id, media) => setAttributes({ imageId: id })}
/>;
```

Renders nothing for users who can't upload media, as `MediaUploadCheck` does.

## Props

| Prop          | Type       | Default    | Description |
| ------------- | ---------- | ---------- | ----------- |
| `value`       | `number`   |            | Attachment ID of the image. Empty or `0` shows the "Choose an image" button. |
| `onChange`    | `function` |            | Called with `(id, media)` when an image is chosen, where `media` is the object from the media library. Called with `(null, null)` when the image is removed. |
| `label`       | `string`   |            | Field label. |
| `help`        | `string`   |            | Help text shown under the field. |
| `className`   | `string`   |            | Extra class for the field. |
| `imageSize`   | `string`   | `"large"`  | Image size to preview. Falls back to the original image when the size doesn't exist. |
| `aspectRatio` | `string`   | `"2 / 1"`  | CSS `aspect-ratio` of the preview. The image is cropped to fit. |
