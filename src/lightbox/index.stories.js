/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import { Button } from "@wordpress/components";

/**
 * External dependencies
 */
import { fn } from "storybook/test";

/**
 * Internal dependencies
 */
import Lightbox from "./index.js";
import { usage } from "../../.storybook/usage.js";

// A generated placeholder image, so stories need no network.
const placeholder = (label, color, width = 800, height = 500) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${color}"/><text x="${width / 2}" y="${height / 2 + 14}" font-family="sans-serif" font-size="42" fill="#fff" text-anchor="middle">${label}</text></svg>`,
	)}`;

const PHOTOS = [
	{ label: "Harbor", color: "#3858e9", caption: "The harbor at dawn." },
	{ label: "Market", color: "#008a20", caption: "Saturday market." },
	{ label: "Bridge", color: "#cc1818", caption: "The old bridge, restored in 2024." },
	{ label: "Library", color: "#7e3bd0" },
];

const ITEMS = PHOTOS.map(({ label, color, caption }) => ({
	content: <img src={placeholder(label, color)} alt={label} />,
	caption,
}));

// Holds the open state, as a block would.
const Playground = ({ onClose, ...args }) => {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<>
			<Button variant="secondary" onClick={() => setIsOpen(true)}>
				Open lightbox
			</Button>
			<Lightbox
				{...args}
				isOpen={isOpen}
				onClose={() => {
					onClose();
					setIsOpen(false);
				}}
			/>
		</>
	);
};

export default {
	title: "Components/Lightbox",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["Lightbox"],
					omit: ["items"],
					extra: [
						"isOpen={isOpen}",
						`items={images.map((image) => ({\n\tcontent: <img src={image.url} alt={image.alt} />,\n\tcaption: image.caption,\n}))}`,
						"onClose={() => setIsOpen(false)}",
					],
				}),
			},
		},
	},
	component: Lightbox,
	render: (args) => <Playground {...args} />,
	args: {
		items: ITEMS,
		label: "Photo gallery",
		onClose: fn(),
	},
	argTypes: {
		items: { control: false },
		isOpen: { control: false },
	},
};

export const Default = {};

export const StartingOnLaterItem = {
	args: {
		initialIndex: 2,
	},
};

export const SingleItem = {
	args: {
		items: ITEMS.slice(0, 1),
	},
};

export const WithEmbed = {
	args: {
		items: [
			...ITEMS.slice(0, 2),
			{
				content: (
					<iframe
						title="Embedded page"
						srcDoc="<body style='margin:0;display:grid;place-items:center;height:100vh;font-family:sans-serif;background:#eee'>An embedded player</body>"
					/>
				),
				caption: "Embeds are scaled to a 16/9 frame.",
			},
		],
	},
};
