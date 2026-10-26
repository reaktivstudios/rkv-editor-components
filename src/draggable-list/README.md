# DraggableList

A list whose items can be reordered by dragging, or with the arrow keys while an item is focused. It reports each move and leaves the reordering to you.

## Usage

```jsx
import { DraggableList } from "@reaktiv/editor-components";

<DraggableList
	onReorder={({ fromIndex, toIndex }) => {
		const items = [...attributes.items];
		items.splice(toIndex, 0, items.splice(fromIndex, 1)[0]);
		setAttributes({ items });
	}}
>
	{attributes.items.map((item) => (
		<ItemCard key={item.id} item={item} />
	))}
</DraggableList>;
```

Give each child a stable `key`, so items keep their state as they move. Dragging one item onto another moves it to that position. With an item focused, the up and down arrow keys (left and right when `orientation="horizontal"`) move it one place, and the move is announced to screen readers. Arrow keys are ignored while focus is inside an item's own controls, such as a text field.

The list is plain flex layout. Style the items through the `rkv-draggable-list__item` class, and tune the highlight with the `--rkv-draggable-list-outline-width` custom property.

## Props

| Prop          | Type       | Default      | Description |
| ------------- | ---------- | ------------ | ----------- |
| `onReorder`   | `function` |              | Called with `{ fromIndex, toIndex }` when an item is dropped on another or moved with the keyboard. |
| `orientation` | `string`   | `"vertical"` | `"vertical"` or `"horizontal"`. Sets the layout direction and which arrow keys move an item. |
| `className`   | `string`   |              | Extra class for the list. |
| `children`    | `node`     |              | The items. A child with `draggable={false}` can't be moved, but can still be dropped on. Lists with a single item aren't draggable. |

Other props, such as `aria-label`, are passed to the list element.
