# @reaktiv/editor-components

Reusable WordPress block editor components from Reaktiv Studios.

## Install

```bash
npm install @reaktiv/editor-components
```

Built for projects bundled with `@wordpress/scripts`. The `@wordpress/*` packages and `react` are peer dependencies, supplied at runtime by WordPress through the dependency extraction plugin.

Include the styles once in your editor bundle:

```js
import "@reaktiv/editor-components/style.css";
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

Releases publish to npm from GitHub Actions ([`npm-publish.yml`](.github/workflows/npm-publish.yml)) using [trusted publishing](https://docs.npmjs.com/trusted-publishers), so no npm token is needed.

1. Bump the version. This updates `package.json` and `package-lock.json`, commits, and creates a matching `v`-prefixed tag:

   ```bash
   npm version patch
   ```

2. Push the commit and tag:

   ```bash
   git push --follow-tags
   ```

3. Create a GitHub release from the tag. The workflow checks that the tag matches `package.json`, runs the tests, then publishes.

### First-time setup

Trusted publishing is configured from the package's settings on npmjs.com, so the package must exist first:

1. Publish once from your machine. Your npm account must be a member of the `@reaktiv` org.

   ```bash
   npm login
   npm publish
   ```

2. On npmjs.com, open the package's **Settings → Trusted Publisher → GitHub Actions** and enter organization `reaktivstudios`, repository `rkv-editor-components`, and workflow `npm-publish.yml`.
3. Under publishing access, choose **Require two-factor authentication and disallow tokens**.

`publishConfig.access` is set to `public`, which scoped packages require for a public release.
