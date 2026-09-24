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
import PostModal from "./index.js";

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
			<PostModal
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
	title: "Components/PostModal",
	component: PostModal,
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
