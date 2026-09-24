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
import PostSearchField from "./index.js";

// Holds the selected ID, as a block's edit function would. The width matches
// the block inspector sidebar, where the field usually lives.
const Playground = ({ onChange, value: initialValue, ...args }) => {
	const [value, setValue] = useState(initialValue ?? null);

	return (
		<div style={{ width: 280 }}>
			<PostSearchField
				{...args}
				value={value}
				onChange={(id, suggestion) => {
					onChange(id, suggestion);
					setValue(id);
				}}
			/>
			<p>Selected ID: {value ?? "none"}</p>
		</div>
	);
};

export default {
	title: "Components/PostSearchField",
	component: PostSearchField,
	render: (args) => <Playground {...args} />,
	args: {
		queryArgs: { postType: "post" },
		onChange: fn(),
	},
};

export const Default = {};

export const SeveralPostTypes = {
	args: {
		queryArgs: { postType: ["post", "video", "page"] },
	},
};

export const FilteredByCategory = {
	args: {
		queryArgs: { postType: ["post", "video"], categories: [2] },
		help: "Posts and videos in Sports.",
	},
};

export const SortedByTitle = {
	args: {
		queryArgs: { postType: ["post", "video"], orderby: "title", order: "asc" },
	},
};

export const WithSelectedPost = {
	args: {
		queryArgs: { postType: ["post", "video"] },
		value: 103,
	},
};

export const CustomLabels = {
	args: {
		label: "Featured video",
		placeholder: "Search videos...",
		help: "Pick the video shown at the top of the page.",
		queryArgs: { postType: "video" },
	},
};

// Opens the dropdown as soon as the field renders, before anything is typed.
export const InitialSuggestions = {
	args: {
		queryArgs: { postType: ["post", "video"] },
		showInitialSuggestions: true,
	},
};
