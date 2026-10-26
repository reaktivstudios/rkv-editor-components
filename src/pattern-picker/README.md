# PatternPicker

A block toolbar button that replaces a block's inner blocks with one of the patterns registered for that block type. Also exports the `usePatternsForBlock` hook it's built on.

## Usage

Render it inside the block's `edit` function, next to its inner blocks:

```jsx
import { InnerBlocks, useBlockProps } from "@wordpress/block-editor";
import { PatternPicker } from "@reaktiv/editor-components";

const Edit = ({ clientId }) => (
	<div {...useBlockProps()}>
		<PatternPicker clientId={clientId} />
		<InnerBlocks />
	</div>
);
```

Patterns are matched through their `Block Types` header, so a pattern file with `Block Types: my/block` shows up in `my/block`'s picker. Only patterns that can be inserted inside the block are offered, and patterns flagged `Inserter: no` are left out. The control renders nothing when no pattern matches.

## Props

| Prop          | Type     | Default            | Description |
| ------------- | -------- | ------------------ | ----------- |
| `clientId`    | `string` |                    | Client ID of the block to populate. |
| `chooseLabel` | `string` | "Choose pattern"   | Toolbar button text while the block has no inner blocks. |
| `changeLabel` | `string` | "Change design"    | Toolbar button text once the block has inner blocks. |

## usePatternsForBlock

```js
import { usePatternsForBlock } from "@reaktiv/editor-components";

const patterns = usePatternsForBlock(clientId);
```

Returns the patterns registered for the block's type that can be inserted inside it, each with its parsed `blocks`.
