# ClampControl

A RangeControl with three thumbs, like CSS `clamp()`: a minimum (▶), a preferred value (●) and a maximum (◀). The thumbs can't cross; moving one pushes its neighbors.

```jsx
<ClampControl
	label="Font size"
	value={{ min: 16, ideal: 24, max: 40 }}
	onChange={(value) => setAttributes({ fontSize: value })}
	rangeMin={8}
	rangeMax={64}
/>
```

| Prop                   | Type            | Default                 | Description |
| ---------------------- | --------------- | ----------------------- | ----------- |
| `label`                | `string`        |                         | Control label. |
| `help`                 | `string`        |                         | Help text below the control. |
| `value`                | `object`        |                         | `{ min, ideal, max }`. |
| `onChange`             | `function`      |                         | Called with `{ min, ideal, max }`. |
| `rangeMin`, `rangeMax` | `number`        | `0`, `100`              | Allowed range. |
| `step`                 | `number`        | `1`                     | Step between values. |
| `unit`                 | `string`        | `"px"`                  | Shown after each value. |
| `withInputField`       | `boolean`       | `true`                  | Show a number field per thumb. |
| `allowReset`           | `boolean`       | `false`                 | Show a Reset button. |
| `resetFallbackValue`   | `object`        | range ends              | `{ min, ideal, max }` that Reset sets. |
| `disabled`             | `boolean`       | `false`                 | Dim the control and ignore input. |
| `showTooltip`          | `boolean`       | `true`                  | Show the value above a focused thumb. |
| `renderTooltipContent` | `function`      | the value               | `(value) => node` for the tooltip. |
| `marks`                | `boolean\|array` | `false`                | `true` for a tick at every step, or `[{ value, label? }]`. |
| `hideLabelFromVision`  | `boolean`       | `false`                 | Hide the label visually. |
| `className`            | `string`        |                         | Additional class name. |
