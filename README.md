# @reaktiv/editor-components

Reusable WordPress block editor components from Reaktiv Studios.

## Install

```bash
npm install @reaktiv/editor-components
```

Built for projects bundled with `@wordpress/scripts`. Most `@wordpress/*` packages and `react` are peer dependencies, supplied at runtime by WordPress through the dependency extraction plugin. `@wordpress/icons` is a regular dependency because `@wordpress/scripts` bundles it instead.

Each component brings its own styles. Importing a component is all it takes:

```js
import { PostModal } from "@reaktiv/editor-components";
```

In a block built with `@wordpress/scripts`, the component's CSS is bundled into the block's `editorStyle` (`index.css`), so it loads in the editor only. Only the components you import add CSS.

To load every component's styles yourself instead, use `@reaktiv/editor-components/editor.css`.

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

`build/` holds the Babel-compiled ES modules, with each component's `editor.scss` compiled to `editor.css` next to it. Component styles are named `editor.scss`, not `style.scss`, because `@wordpress/scripts` moves any `style.*` file into the block's front-end stylesheet. `build/` is regenerated on `npm publish`.

Tests live next to each component as `*.test.js` and run with Jest. They mock the heavier `@wordpress/*` packages (components, data, core-data, block-editor) and test the component's own logic.

## Releasing

Releases are published to npm by GitHub Actions ([`npm-publish.yml`](.github/workflows/npm-publish.yml)) when a GitHub release is created. The workflow uses [trusted publishing](https://docs.npmjs.com/trusted-publishers): npm trusts this repository's workflow directly, so there's no npm token to manage.

### Before you start

Make sure you're on an up-to-date `main` with no uncommitted changes, and that the tests pass:

```bash
git checkout main && git pull
npm test
```

`npm version` (step 1) refuses to run with uncommitted changes, so a clean tree is required anyway.

### 1. Bump the version

```bash
npm version patch -m "Release %s"
```

This does three things in one step:

- Updates `version` in `package.json` and `package-lock.json` (for example, `0.1.2` → `0.1.3`).
- Commits those two files. `-m "Release %s"` sets the commit message, where `%s` becomes the new version.
- Creates a git tag for the new version, prefixed with `v` (for example, `v0.1.3`).

Pick the bump that matches the change, following [semantic versioning](https://semver.org/):

- `patch` (`0.1.2` → `0.1.3`): bug fixes that don't change how the components are used.
- `minor` (`0.1.2` → `0.2.0`): new components, props, or features. While the version is `0.x`, also use `minor` for breaking changes. npm treats a `0.x` minor bump as breaking, so `^0.1.2` won't pick up `0.2.0`.
- `major` (`0.1.2` → `1.0.0`): breaking changes once the package is at `1.0.0` or later.

Nothing has left your machine yet. To undo, delete the tag (`git tag -d v0.1.3`) and reset the commit (`git reset --hard HEAD~1`).

### 2. Push the commit and tag

```bash
git push --follow-tags
```

`git push` on its own sends commits but not tags. `--follow-tags` also pushes the tags that point at the commits being pushed, so GitHub gets both the version commit and its `v0.1.3` tag.

Pushing doesn't publish anything. The workflow only runs when a GitHub release is created.

### 3. Create a GitHub release

```bash
gh release create v0.1.3 --title v0.1.3 --generate-notes
```

Or on GitHub: **Releases → Draft a new release**, choose the tag you pushed, and click **Publish release**.

`--generate-notes` fills the release notes with the commits and pull requests since the previous release. Creating the release starts the workflow, which:

1. Checks that the release tag matches the version in `package.json`, and stops if it doesn't. This catches releases made from a mistyped or stale tag.
2. Installs dependencies with `npm ci` and runs the tests.
3. Runs `npm publish`, which builds the package first (`prepublishOnly`), then publishes it. npm authenticates the workflow through GitHub's OIDC token and attaches a [provenance](https://docs.npmjs.com/generating-provenance-statements) statement, linking the published version to the commit and workflow run that built it.

### 4. Check that it published

Watch the run under the repository's **Actions** tab, or from the terminal:

```bash
gh run watch
```

Then confirm npm has the new version. A new version can take a minute or two to appear.

```bash
npm view @reaktiv/editor-components version
```

### If the workflow fails

- **Failed before publishing** (tag check, install, or tests): nothing reached npm. Fix the problem on `main`, then release the next version (`npm version patch` again) rather than reusing the failed one. Re-running the failed run won't help, because it builds the commit the tag points to.
- **Failed at `npm publish`:** read the npm error in the log. The package wasn't published unless the log says so.
- **Once a version is on npm, its number can never be reused**, even after unpublishing. Fixes always go out as a new version.

### First-time setup

This has already been done for `@reaktiv/editor-components`, and is kept here for reference. Trusted publishing is configured from the package's settings on npmjs.com, so the package must exist first:

1. Publish once from your machine. Your npm account must be a member of the `@reaktiv` org.

   ```bash
   npm login
   npm publish
   ```

2. On npmjs.com, open the package's **Settings → Trusted Publisher → GitHub Actions** and enter organization `reaktivstudios`, repository `rkv-editor-components`, and workflow `npm-publish.yml`.
3. Under publishing access, choose **Require two-factor authentication and disallow tokens**.

`publishConfig.access` is set to `public`, which scoped packages require for a public release.
