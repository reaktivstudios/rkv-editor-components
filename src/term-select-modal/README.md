# TermSelectModal

A modal for searching and selecting taxonomy terms, with grid and list views and "Load more" pagination. The term counterpart to [`PostSelectModal`](../post-select-modal/README.md).

## Usage

```jsx
import { TermSelectModal } from "@reaktiv/editor-components";

<TermSelectModal
	isOpen={isOpen}
	taxonomy="category"
	termCount={3}
	selectedTermIds={attributes.termIds}
	onSelect={(ids, terms) => {
		setAttributes({ termIds: ids });
		setIsOpen(false);
	}}
	onClose={() => setIsOpen(false)}
/>;
```

The modal mounts fresh each time it opens, so selection, search, and view reset on every open. When more than one term can be selected, each selected item shows a badge with its selection order.

## Props

| Prop              | Type       | Default            | Description |
| ----------------- | ---------- | ------------------ | ----------- |
| `isOpen`          | `boolean`  |                    | Renders the modal when `true`. |
| `onSelect`        | `function` |                    | Called with `(ids, terms)` on insert. `terms` holds the full REST records for the selected IDs that have loaded. |
| `onClose`         | `function` |                    | Called when the modal is dismissed. |
| `taxonomy`        | `string`   | `"category"`       | Taxonomy slug, e.g. `"post_tag"`. |
| `queryArgs`       | `object`   | `{}`               | REST collection args for the taxonomy. Merged over `{ per_page: 50, context: "view", orderby: "name", order: "asc", hide_empty: false }`. The search box adds `search`. |
| `termCount`       | `number`   | `1`                | Maximum number of terms that can be selected. Selecting past the limit drops the oldest selection. |
| `selectedTermIds` | `number[]` | `[]`               | Terms selected when the modal opens. |
| `title`           | `string`   | "Select {taxonomy}" | Modal title. |
| `insertLabel`     | `string`   | "Insert {taxonomy}" | Insert button text. |
| `getImageUrl`     | `function` |                    | `(term) => string`. Returns a thumbnail URL for a term. Terms without one show their first two letters. |
| `renderItem`      | `function` |                    | `({ term, isSelected, view }) => Element`. Replaces each item's content; click, keyboard, and selection handling stay in place. To use hooks, return a component rather than calling hooks inside the function. |
| `views`           | `string[]` | `["grid", "list"]` | Available views. The toggle is hidden when only one is given. |
| `defaultView`     | `string`   | first of `views`   | View shown when the modal opens. |
