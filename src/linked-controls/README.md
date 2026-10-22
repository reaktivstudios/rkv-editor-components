# LinkedControls

Renders one control for two values (`x` and `y`) until the user unlinks them, then one control per value. Starts unlinked when the values already differ.

```jsx
<LinkedControls
	values={{ x: 4, y: 4 }}
	onChange={({ x, y }) => setGap({ x, y })}
	linkedLabel="Gap"
	fields={[
		{ key: "x", label: "Horizontal" },
		{ key: "y", label: "Vertical" },
	]}
>
	{({ label, value, onChange }) => <RangeControl label={label} value={value} onChange={onChange} />}
</LinkedControls>
```

| Prop          | Type       | Default          | Description |
| ------------- | ---------- | ---------------- | ----------- |
| `values`      | `object`   |                  | `{ x, y }`. |
| `onChange`    | `function` |                  | Called with `{ x, y }`. Linked edits send the same value for both. |
| `fields`      | `array`    |                  | `[{ key: "x" \| "y", label }]`, the label for each value when unlinked. |
| `linkedLabel` | `string`   |                  | Control label while linked. |
| `unlinkLabel` | `string`   | "Unlink values"  | Toggle label while linked. |
| `linkLabel`   | `string`   | "Link values"    | Toggle label while unlinked. |
| `children`    | `function` |                  | `({ label, value, onChange }) => control`. |

Relinking sets both values to `x`.
