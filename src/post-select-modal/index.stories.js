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
import PostSelectModal from "./index.js";
import { usage } from "../../.storybook/usage.js";

// Holds the open state and last selection, as a block's edit function would.
const Playground = ({ onSelect, onClose, ...args }) => {
	const [isOpen, setIsOpen] = useState(true);
	const [selection, setSelection] = useState(args.selectedPostIds || []);

	return (
		<>
			<Button variant="secondary" onClick={() => setIsOpen(true)}>
				Open modal
			</Button>
			<p>Selected IDs: {selection.length ? selection.join(", ") : "none"}</p>
			<PostSelectModal
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
	title: "Components/PostSelectModal",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["PostSelectModal"],
					react: 'import { useState } from "@wordpress/element";',
					omit: ["selectedPostIds", "renderItem"],
					state: (args) => `const [isOpen, setIsOpen] = useState(false);
const [postIds, setPostIds] = useState(${JSON.stringify(args.selectedPostIds || [])});`,
					extra: (args) => [
						"isOpen={isOpen}",
						"selectedPostIds={postIds}",
						"onSelect={(ids, posts) => {\n\tsetPostIds(ids);\n\tsetIsOpen(false);\n}}",
						"onClose={() => setIsOpen(false)}",
						...(args.renderItem
							? [`renderItem={({ post, isSelected }) => (\n\t<div>\n\t\t<strong>{post.title.rendered}</strong>\n\t\t<div>{isSelected ? "✓ Selected" : \`ID \${post.id}\`}</div>\n\t</div>\n)}`]
							: []),
					],
				}),
			},
		},
	},
	component: PostSelectModal,
	render: (args) => <Playground {...args} />,
	args: {
		queryArgs: { postType: "post" },
		postCount: 1,
		onSelect: fn(),
		onClose: fn(),
	},
	argTypes: {
		defaultView: { control: "inline-radio", options: ["grid", "list"] },
		imageSize: { control: "text" },
		renderItem: { control: false },
		isOpen: { control: false },
	},
};

export const Default = {};

export const VideosWithShowBadges = {
	args: {
		queryArgs: { postType: "video" },
		badgeTaxonomy: "show",
	},
};

export const MultipleSelection = {
	args: {
		postCount: 3,
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

export const ListViewOnly = {
	args: {
		views: ["list"],
	},
};

export const CustomLabels = {
	args: {
		title: "Choose a featured story",
		insertLabel: "Feature it",
	},
};

export const CustomItemRendering = {
	args: {
		renderItem: ({ post, isSelected }) => (
			<div style={{ padding: 8 }}>
				<strong>{post.title.rendered}</strong>
				<div>{isSelected ? "✓ Selected" : `ID ${post.id}`}</div>
			</div>
		),
	},
};
