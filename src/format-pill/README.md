# FormatPill

A pill showing a column's format. It opens a menu to choose another, with a preview of each.

```jsx
<FormatPill value="usd" formats={DEFAULT_DATA_COLUMN_FORMATS} onChange={(slug) => setFormat(slug)} />
```

| Prop            | Type       | Default           | Description |
| --------------- | ---------- | ----------------- | ----------- |
| `value`         | `string`   |                   | Current format slug. |
| `formats`       | `object`   |                   | Formats keyed by slug: `{ label, preview }`. |
| `onChange`      | `function` |                   | Called with the chosen slug. |
| `defaultFormat` | `string`   | `"text"`          | Slug shown when `value` isn't in `formats`. |
| `label`         | `string`   | "Column format"   | Accessible label. |
