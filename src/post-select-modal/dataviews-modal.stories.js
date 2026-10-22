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
import PostSelectModalDataViews from "./dataviews-modal.js";
import { usage } from "../../.storybook/usage.js";

// Docs renders every story inline, so only open the modal on its own story page.
const Playground = ({ onSelect, onClose, startOpen, ...args }) => {
	const [isOpen, setIsOpen] = useState(startOpen);
	const [selection, setSelection] = useState(args.selectedPostIds || []);

	return (
		<>
			<Button variant="secondary" onClick={() => setIsOpen(true)}>
				Open modal
			</Button>
			<p>Selected IDs: {selection.length ? selection.join(", ") : "none"}</p>
			<PostSelectModalDataViews
				{...args}
				isOpen={isOpen}
				selectedPostIds={selection}
				onSelect={(ids, posts) => {
					onSelect(ids, posts);
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

export default {
	title: "Experimental/PostSelectModal (DataViews)",
	tags: ["experimental"],
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["__experimentalPostSelectModal as PostSelectModal"],
					react: 'import { useState } from "@wordpress/element";',
					omit: ["selectedPostIds"],
					state: (args) => `const [isOpen, setIsOpen] = useState(false);
const [postIds, setPostIds] = useState(${JSON.stringify(args.selectedPostIds || [])});`,
					extra: [
						"isOpen={isOpen}",
						"selectedPostIds={postIds}",
						"onSelect={(ids, posts) => {\n\tsetPostIds(ids);\n\tsetIsOpen(false);\n}}",
						"onClose={() => setIsOpen(false)}",
					],
				}),
			},
			description: {
				component:
					"**Experimental.** A prototype of `PostSelectModal` built on `DataViewsPicker` from `@wordpress/dataviews`. Exported as `__experimentalPostSelectModal`; the API may change or be dropped.",
			},
		},
	},
	component: PostSelectModalDataViews,
	render: (args, { viewMode }) => (
		<Playground {...args} startOpen={viewMode !== "docs"} />
	),
	args: {
		queryArgs: { postType: "post" },
		postCount: 1,
		onSelect: fn(),
		onClose: fn(),
	},
	argTypes: {
		views: { control: "check", options: ["pickerGrid", "pickerTable"] },
		imageSize: { control: "text" },
		isOpen: { control: false },
	},
};

export const Default = {};

export const MultipleSelection = {
	args: { postCount: 3 },
};

export const TableOnly = {
	args: { views: ["pickerTable"] },
};

export const VideosWithShowBadges = {
	args: {
		queryArgs: { postType: "video" },
		badgeTaxonomy: "show",
	},
};

export const Preselected = {
	args: {
		postCount: 2,
		selectedPostIds: [101, 102],
	},
};

export const FilteredByCategory = {
	args: {
		queryArgs: { postType: "post", categories: [2] },
		title: "Select a sports story",
	},
};

export const CustomLabels = {
	args: {
		title: "Choose a featured story",
		insertLabel: "Feature it",
	},
};
