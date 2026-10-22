# StyleIndicator

A 24px circle that previews a style: a fill color, an optional outline ring, and a solid, dashed or dotted ring.

```jsx
<StyleIndicator color="#3858e9" outlineColor="#cc1818" lineStyle="dashed" />
```

| Prop           | Type     | Default   | Description |
| -------------- | -------- | --------- | ----------- |
| `color`        | `string` |           | Fill color. Without one, the circle shows the "no color" slash. |
| `outlineColor` | `string` |           | Ring color. |
| `lineStyle`    | `string` | `"solid"` | `"dashed"` or `"dotted"` draw a dashed or dotted ring. |
| `fillStyle`    | `string` | `"solid"` | Adds an `is-fill-{slug}` class for custom fill styling. |
| `className`    | `string` |           | Additional class name. |
