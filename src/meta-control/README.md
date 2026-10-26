# MetaControl

A form control bound to a post meta value. It shows the value and edits it as the post's unsaved changes, so there's no `setAttributes`, store wiring, or save button to write. Also exports the `useMetaValue` hook it's built on.

## Usage

Inside the post editor, in a sidebar panel for example:

```jsx
import { PluginDocumentSettingPanel } from "@wordpress/editor";
import { MetaControl } from "@reaktiv/editor-components";

<PluginDocumentSettingPanel name="article-options" title="Article options">
	<MetaControl metaKey="show_byline" type="toggle" label="Show the byline" />
	<MetaControl
		metaKey="layout"
		type="select"
		label="Layout"
		options={[
			{ label: "Standard", value: "standard" },
			{ label: "Wide", value: "wide" },
		]}
	/>
	<MetaControl metaKey="summary" type="textarea" label="Summary" />
</PluginDocumentSettingPanel>;
```

The meta key has to be registered for the REST API, or the value is never loaded and doesn't save:

```php
register_post_meta( 'post', 'show_byline', array(
	'show_in_rest' => true,
	'single'       => true,
	'type'         => 'boolean',
) );
```

The post type also needs `custom-fields` support.

## Props

| Prop       | Type              | Default                  | Description |
| ---------- | ----------------- | ------------------------ | ----------- |
| `metaKey`  | `string`          |                          | The meta key. |
| `type`     | `string`          | `"text"`                 | What to render: `"text"`, `"textarea"`, `"toggle"`, `"checkbox"`, `"select"`, `"radio"`, `"range"`, or `"color"`. |
| `onChange` | `function`        |                          | Called with the new value after the meta is updated. |
| `postType` | `string`          | the post being edited    | Post type of the record to edit. |
| `postId`   | `number`/`string` | the post being edited    | ID of the record to edit. |

Every other prop goes to the control for that `type`, such as `label`, `help`, `options`, `min`, `max`, or `className`. The meta value is passed as that control's value (`checked` for toggles and checkboxes, `selected` for radios), so don't pass your own. While the meta is unset, text, select and radio show an empty value and toggles and checkboxes show unchecked.

## useMetaValue

For a control the types don't cover, or to read a value:

```js
import { useMetaValue } from "@reaktiv/editor-components";

const [value, setValue] = useMetaValue("byline_image_id");
```

`useMetaValue( metaKey, { postType, postId } )` returns `[value, setValue]`. The value is `undefined` until the meta loads. It works with any control, such as an [`ImagePicker`](../image-picker/README.md) that stores an attachment ID.
