# @rkv/editor-components

Reusable WordPress block editor components from Reaktiv Studios.

## Install

```bash
npm install @rkv/editor-components
```

Built for projects bundled with `@wordpress/scripts`. The `@wordpress/*` packages and `react` are peer dependencies, supplied at runtime by WordPress through the dependency extraction plugin.

Include the styles once in your editor bundle:

```js
import "@rkv/editor-components/style.css";
```

## Components

| Component | Description |
| --- | --- |
| [`PostModal`](src/post-modal/README.md) | A modal for searching and selecting posts. |
| [`PostSearchField`](src/post-search-field/README.md) | A search field that selects a single post from `queryArgs`-driven suggestions. |

Each component's README documents its props.

## Development

```bash
npm install
npm run build
npm test
```

`build/` holds the Babel-compiled ES modules; `build-style/style.css` holds the compiled styles. Both are generated on `npm publish`.

Tests live next to each component as `*.test.js` and run with Jest. They mock the heavier `@wordpress/*` packages (components, data, core-data, block-editor) and test the component's own logic.

## Publishing

The `@rkv` scope must exist on npm and your account must be a member of it.

```bash
npm login
npm publish
```

`publishConfig.access` is set to `public`, which scoped packages require for a public release.
