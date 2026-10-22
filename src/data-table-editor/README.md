# DataTableEditor

A spreadsheet-style editor for a table of text. Type or paste cells (multi-cell pastes from a spreadsheet fill the grid), add, remove and reorder rows and columns, import a CSV or `.xlsx` file, and undo and redo. The first row is the header row, and each column has a [`FormatPill`](../format-pill/README.md).

Cells are stored as text. Formats only describe how a column's values are displayed; apply them where you render the data.

It renders inline, with its own toolbar, and keeps its own state starting from `data`. It reports each change through `onChange`.

```jsx
<DataTableEditor
	data={attributes.rows}
	columnFormats={attributes.columnFormats}
	onChange={(rows, columnFormats) => setAttributes({ rows, columnFormats })}
/>
```

To edit in a full-size modal with Cancel and Apply, use `DataTableEditorModal`. It takes the same props, plus `title`, `onSave` and `onClose`, and asks before discarding unapplied edits.

```jsx
{isOpen && (
	<DataTableEditorModal
		data={attributes.rows}
		columnFormats={attributes.columnFormats}
		onSave={(rows, columnFormats) => {
			setAttributes({ rows, columnFormats });
			setIsOpen(false);
		}}
		onClose={() => setIsOpen(false)}
	/>
)}
```

Requires `@wordpress/undo-manager`. `.xlsx` files are read in the browser with `DecompressionStream`, so no spreadsheet library is needed.

| Prop             | Type         | Default            | Description |
| ---------------- | ------------ | ------------------ | ----------- |
| `data`           | `string[][]` |                    | Header row followed by data rows. Read once, when the editor mounts. |
| `columnFormats`  | `string[]`   | `[]`               | Format slug per column. Read once, when the editor mounts. |
| `formats`        | `object`     | `DEFAULT_DATA_COLUMN_FORMATS`  | Available formats keyed by slug: `{ label, preview }`. Extra keys are yours to use. |
| `readOnly`       | `boolean`    | `false`            | Locks the cells. Column formats can still change. |
| `readOnlyNotice` | `string`     |                    | Notice above the table when `readOnly`. |
| `onChange`       | `function`   |                    | Called with `(rows, columnFormats)` after each change, including undo and redo. |
| `className`      | `string`     |                    | Additional class name. |

Importing replaces the table after a confirmation and guesses a format per column (percent, US dollars, year, number), limited to the slugs in `formats`.

## `DataTableEditorModal` props

| Prop      | Type       | Default     | Description |
| --------- | ---------- | ----------- | ----------- |
| `title`   | `string`   | "Edit data" | Modal title ("View data" when read-only). |
| `onSave`  | `function` |             | Called with `(rows, columnFormats)` on Apply. |
| `onClose` | `function` |             | Called on cancel, after confirming when there are unapplied edits. |

All other props go to `DataTableEditor`.

## Helpers

`DEFAULT_DATA_COLUMN_FORMAT`, `DEFAULT_DATA_COLUMN_FORMATS`, `detectDataColumnFormats(rows, formats)`, `parseDelimited(text)` and `parseXlsx(buffer)` are exported for use outside the modal.
