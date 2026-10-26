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
import TermSelectModal from "./index.js";
import { usage } from "../../.storybook/usage.js";

// Holds the open state and last selection, as a block's edit function would.
const Playground = ({ onSelect, onClose, ...args }) => {
	const [isOpen, setIsOpen] = useState(true);
	const [selection, setSelection] = useState(args.selectedTermIds || []);

	return (
		<>
			<Button variant="secondary" onClick={() => setIsOpen(true)}>
				Open modal
			</Button>
			<p>Selected IDs: {selection.length ? selection.join(", ") : "none"}</p>
			<TermSelectModal
				{...args}
				isOpen={isOpen}
				selectedTermIds={selection}
				onSelect={(ids, terms) => {
					onSelect(ids, terms);
					setSelection(ids);
					setIsOpen(false);
				}}
				onClose={() => {
					onClose();
					setIsOpen(false);
				}}
			/>
		</>
	);
};

// A square SVG tile in a color derived from the term, standing in for a real image.
const placeholderImage = (term) => {
	const hue = (term.id * 67) % 360;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="hsl(${hue} 55% 55%)"/></svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default {
	title: "Components/TermSelectModal",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["TermSelectModal"],
					react: 'import { useState } from "@wordpress/element";',
					omit: ["selectedTermIds", "renderItem", "getImageUrl"],
					state: (args) => `const [isOpen, setIsOpen] = useState(false);
const [termIds, setTermIds] = useState(${JSON.stringify(args.selectedTermIds || [])});`,
					extra: (args) => [
						"isOpen={isOpen}",
						"selectedTermIds={termIds}",
						"onSelect={(ids, terms) => {\n\tsetTermIds(ids);\n\tsetIsOpen(false);\n}}",
						"onClose={() => setIsOpen(false)}",
						...(args.getImageUrl
							? ["getImageUrl={(term) => term.meta?.image_url}"]
							: []),
						...(args.renderItem
							? [`renderItem={({ term, isSelected }) => (\n\t<div>\n\t\t<strong>{term.name}</strong>\n\t\t<div>{isSelected ? "✓ Selected" : \`ID \${term.id}\`}</div>\n\t</div>\n)}`]
							: []),
					],
				}),
			},
		},
	},
	component: TermSelectModal,
	render: (args) => <Playground {...args} />,
	args: {
		taxonomy: "category",
		termCount: 1,
		onSelect: fn(),
		onClose: fn(),
	},
	argTypes: {
		defaultView: { control: "inline-radio", options: ["grid", "list"] },
		getImageUrl: { control: false },
		renderItem: { control: false },
		isOpen: { control: false },
	},
};

export const Default = {};

export const Shows = {
	args: {
		taxonomy: "show",
	},
};

export const MultipleSelection = {
	args: {
		taxonomy: "show",
		termCount: 3,
	},
};

export const Preselected = {
	args: {
		taxonomy: "category",
		termCount: 2,
		selectedTermIds: [1, 3],
	},
};

export const WithImages = {
	args: {
		taxonomy: "show",
		getImageUrl: placeholderImage,
	},
};

export const ListViewOnly = {
	args: {
		views: ["list"],
	},
};

export const CustomLabels = {
	args: {
		title: "Choose a featured topic",
		insertLabel: "Feature it",
	},
};

export const CustomItemRendering = {
	args: {
		renderItem: ({ term, isSelected }) => (
			<div style={{ padding: 8 }}>
				<strong>{term.name}</strong>
				<div>{isSelected ? "✓ Selected" : `ID ${term.id}`}</div>
			</div>
		),
	},
};
