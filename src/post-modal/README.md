# PostModal

A modal for searching and selecting posts, with grid and list views and "Load more" pagination.

## Usage

```jsx
import { PostModal } from "@reaktiv/editor-components";

<PostModal
	isOpen={isOpen}
	queryArgs={{ postType: "video", categories: [3] }}
	postCount={3}
	selectedPostIds={attributes.postIds}
	onSelect={(ids, posts) => {
		setAttributes({ postIds: ids });
		setIsOpen(false);
	}}
	onClose={() => setIsOpen(false)}
/>;
```

The modal mounts fresh each time it opens, so selection, search, and view reset on every open.

## Props

| Prop              | Type       | Default             | Description |
| ----------------- | ---------- | ------------------- | ----------- |
| `isOpen`          | `boolean`  |                     | Renders the modal when `true`. |
| `onSelect`        | `function` |                     | Called with `(ids, posts)` on insert. `posts` holds the full REST records for the selected IDs that have loaded. |
| `onClose`         | `function` |                     | Called when the modal is dismissed. |
| `queryArgs`       | `object`   | `{}`                | `postType` (default `"post"`) plus any REST collection args for that post type. Merged over `{ per_page: 20, context: "view" }`. The search box adds `search`. |
| `postCount`       | `number`   | `1`                 | Maximum number of posts that can be selected. Selecting past the limit drops the oldest selection. |
| `selectedPostIds` | `number[]` | `[]`                | Posts selected when the modal opens. |
| `title`           | `string`   | "Select {type}"     | Modal title. |
| `insertLabel`     | `string`   | "Insert {type(s)}"  | Insert button text. |
| `badgeTaxonomy`   | `string`   |                     | Taxonomy whose first term is shown as a badge on each thumbnail. Must match the taxonomy's REST base (e.g. `"category"`). |
| `imageSize`       | `string`   | `"full"`            | Featured image size to display. Falls back to the original image. |
| `renderItem`      | `function` |                     | `({ post, isSelected, view }) => Element`. Replaces each item's content; click, keyboard, and selection handling stay in place. To use hooks, return a component rather than calling hooks inside the function. |
| `views`           | `string[]` | `["grid", "list"]`  | Available views. The toggle is hidden when only one is given. |
| `defaultView`     | `string`   | first of `views`    | View shown when the modal opens. |
