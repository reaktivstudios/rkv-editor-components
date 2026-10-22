# DataTableEditor

A modal spreadsheet for editing a table of text. Type or paste cells (multi-cell pastes from a spreadsheet fill the grid), add, remove and reorder rows and columns, import a CSV or `.xlsx` file, and undo and redo. The first row is the header row, and each column has a [`FormatPill`](../format-pill/README.md).

Cells are stored as text. Formats only describe how a column's values are displayed; apply them where you render the data.

```jsx
{isOpen && (
	<DataTableEditor
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
| `data`           | `string[][]` |                    | Header row followed by data rows. |
| `columnFormats`  | `string[]`   | `[]`               | Format slug per column. |
| `formats`        | `object`     | `DEFAULT_FORMATS`  | Available formats keyed by slug: `{ label, preview }`. Extra keys are yours to use. |
| `readOnly`       | `boolean`    | `false`            | Locks the cells. Column formats can still change. |
| `title`          | `string`     | "Edit data"        | Modal title ("View data" when read-only). |
| `readOnlyNotice` | `string`     |                    | Notice above the table when `readOnly`. |
| `onSave`         | `function`   |                    | Called with `(rows, columnFormats)`. |
| `onClose`        | `function`   |                    | Called on cancel, after confirming when there are unapplied edits. |

Importing replaces the table after a confirmation and guesses a format per column (percent, US dollars, year, number), limited to the slugs in `formats`.

## Helpers

`DEFAULT_FORMAT`, `DEFAULT_FORMATS`, `detectColumnFormats(rows, formats)`, `parseDelimited(text)` and `parseXlsx(buffer)` are exported for use outside the modal.
