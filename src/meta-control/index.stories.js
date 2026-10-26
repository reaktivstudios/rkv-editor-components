/**
 * WordPress dependencies
 */
import { useEntityProp } from "@wordpress/core-data";

/**
 * Internal dependencies
 */
import MetaControl from "./index.js";
import { usage } from "../../.storybook/usage.js";

// A fixture post from the mock API. Inside the post editor, these props are left out.
const POST = { postType: "post", postId: 101 };

// Shows the post's meta as it's being edited.
const MetaPreview = () => {
	const [meta] = useEntityProp("postType", POST.postType, "meta", POST.postId);

	return <pre style={{ fontSize: 11 }}>{JSON.stringify(meta ?? {}, null, 2)}</pre>;
};

const Playground = (args) => (
	<div style={{ width: 280 }}>
		<MetaControl {...POST} {...args} />
		<MetaPreview />
	</div>
);

export default {
	title: "Components/MetaControl",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["MetaControl"],
				}),
			},
		},
	},
	component: MetaControl,
	render: (args) => <Playground {...args} />,
	args: {
		metaKey: "byline",
		label: "Byline",
	},
	argTypes: {
		type: {
			control: "select",
			options: ["text", "textarea", "toggle", "checkbox", "select", "radio", "range", "color"],
		},
		postType: { control: false },
		postId: { control: false },
	},
};

export const Text = {
	args: { type: "text", help: "Shown under the headline." },
};

export const Textarea = {
	args: { type: "textarea", metaKey: "summary", label: "Summary" },
};

export const Toggle = {
	args: { type: "toggle", metaKey: "show_byline", label: "Show the byline" },
};

export const Checkbox = {
	args: { type: "checkbox", metaKey: "sponsored", label: "Sponsored content" },
};

export const Select = {
	args: {
		type: "select",
		metaKey: "layout",
		label: "Layout",
		options: [
			{ label: "Standard", value: "standard" },
			{ label: "Wide", value: "wide" },
			{ label: "Full width", value: "full" },
		],
	},
};

export const Radio = {
	args: {
		type: "radio",
		metaKey: "layout",
		label: "Layout",
		options: [
			{ label: "Standard", value: "standard" },
			{ label: "Wide", value: "wide" },
		],
	},
};

export const Range = {
	args: { type: "range", metaKey: "columns", label: "Columns", min: 1, max: 6 },
};

export const Color = {
	args: {
		type: "color",
		metaKey: "accent",
		colors: [
			{ name: "Blue", color: "#3858e9" },
			{ name: "Green", color: "#008a20" },
			{ name: "Red", color: "#cc1818" },
		],
	},
};
