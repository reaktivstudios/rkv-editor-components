# PostSearchField

A search field that suggests posts matching `queryArgs` and selects a single post ID. Adapted from Curator's `post-select/link-control.js`, and built on the block editor's LinkControl search input.

## Usage

```jsx
import { PostSearchField } from "@reaktiv/editor-components";

<PostSearchField
	queryArgs={{ postType: ["post", "video"], categories: [3], orderby: "date" }}
	value={attributes.postId}
	onChange={(postId) => setAttributes({ postId })}
/>;
```

## Props

| Prop                     | Type       | Default          | Description |
| ------------------------ | ---------- | ---------------- | ----------- |
| `queryArgs`              | `object`   | `{}`             | `postType` (a slug or an array of slugs, default `"post"`) plus any REST collection args. See below. |
| `value`                  | `number`   |                  | Selected post ID. Its title is shown in the input. |
| `onChange`               | `function` |                  | Called with `(id, suggestion)` on select, or `(null, null)` when the input is cleared. `suggestion` is `{ id, title, url, type, kind, postType }`. |
| `label`                  | `string`   | "Search & Add"   | Field label. |
| `help`                   | `string`   |                  | Help text below the field. |
| `placeholder`            | `string`   | "Search..."      | Input placeholder. |
| `hideLabelFromVision`    | `boolean`  | `false`          | Visually hides the label. |
| `showInitialSuggestions` | `boolean`  | `false`          | Shows suggestions as soon as the field renders, before anything is typed. By default, the dropdown appears once a search returns results. |
| `className`              | `string`   |                  | Additional class name. |

## `queryArgs`

Everything except `postType` is sent to each post type's REST collection endpoint (`/wp/v2/posts`, `/wp/v2/pages`, …), so any arg those endpoints accept works.

```js
// One post type.
{ postType: "page" }

// Several post types.
{ postType: ["post", "page", "video"] }

// One taxonomy, keyed by its REST base.
{ postType: "post", categories: [3, 4] }

// Several taxonomies.
{ postType: ["post", "video"], categories: [3], tags: [12], tax_relation: "AND" }

// Sorting and result count.
{ postType: "post", orderby: "title", order: "asc", per_page: 5 }
```

- **Taxonomy filters:** post types that don't use a filtered taxonomy are left out of the results. Their endpoints would ignore the filter and return unfiltered posts.
- **Sorting:** `orderby` and `order` are applied to every post type's results.
  - While searching, `orderby` defaults to `"relevance"`. With nothing typed, it falls back to the REST default (date, newest first).
  - With several post types, results for `date`, `modified`, `title`, and `id` are merged and re-sorted as one list. Other orderings (`relevance`, `include`, …) alternate between post types.
- **`per_page`:** the total number of suggestions shown. Defaults to `10`.
