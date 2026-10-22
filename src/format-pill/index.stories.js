/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";

/**
 * Internal dependencies
 */
import FormatPill from "./index.js";
import { DEFAULT_FORMATS } from "../data-table-editor/column-formats.js";

const Playground = ({ value: initial, ...args }) => {
	const [value, setValue] = useState(initial);
	return <FormatPill {...args} value={value} onChange={setValue} />;
};

export default {
	title: "Components/FormatPill",
	component: FormatPill,
	render: (args) => <Playground {...args} />,
	args: { value: "number", formats: DEFAULT_FORMATS },
};

export const Default = {};
