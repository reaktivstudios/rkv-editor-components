/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";

/**
 * External dependencies
 */
import { fn } from "storybook/test";

/**
 * Internal dependencies
 */
import DraggableList from "./index.js";

const SLIDES = [
	{ id: 1, title: "Welcome" },
	{ id: 2, title: "Our story" },
	{ id: 3, title: "The team" },
	{ id: 4, title: "Contact" },
];

const card = (slide) => (
	<div
		style={{
			padding: "12px 16px",
			border: "1px solid #ddd",
			borderRadius: 2,
			background: "#fff",
		}}
	>
		{slide.title}
	</div>
);

// Holds the order, as a block's attributes would.
const Playground = ({ onReorder, slides, ...args }) => {
	const [items, setItems] = useState(slides);

	return (
		<DraggableList
			{...args}
			aria-label="Slides"
			style={{ gap: 12 }}
			onReorder={(move) => {
				onReorder(move);
				setItems((current) => {
					const next = [...current];
					next.splice(move.toIndex, 0, next.splice(move.fromIndex, 1)[0]);
					return next;
				});
			}}
		>
			{items.map((slide) => (
				<div key={slide.id} draggable={4 === slide.id ? false : undefined}>
					{card(slide)}
				</div>
			))}
		</DraggableList>
	);
};

const CODE = `import { DraggableList } from "@reaktiv/editor-components";

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
</DraggableList>;`;

export default {
	title: "Components/DraggableList",
	component: DraggableList,
	parameters: {
		docs: { source: { code: CODE } },
	},
	render: (args) => <Playground {...args} />,
	args: {
		slides: SLIDES,
		onReorder: fn(),
	},
	argTypes: {
		orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
		slides: { control: false },
		children: { control: false },
	},
	decorators: [
		(Story) => (
			<div style={{ padding: 16 }}>
				<p>Drag an item, or focus one and use the arrow keys. &ldquo;Contact&rdquo; can't be dragged.</p>
				<Story />
			</div>
		),
	],
};

export const Vertical = {};

export const Horizontal = {
	args: {
		orientation: "horizontal",
	},
	decorators: [
		(Story) => (
			<div style={{ "--rkv-draggable-list-outline-width": "4px" }}>
				<Story />
			</div>
		),
	],
};
