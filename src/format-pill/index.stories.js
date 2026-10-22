/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";

/**
 * Internal dependencies
 */
import FormatPill from "./index.js";
import { DEFAULT_DATA_COLUMN_FORMATS } from "../data-table-editor/column-formats.js";
import { usage } from "../../.storybook/usage.js";

const Playground = ({ value: initial, ...args }) => {
	const [value, setValue] = useState(initial);
	return <FormatPill {...args} value={value} onChange={setValue} />;
};

export default {
	title: "Components/FormatPill",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["FormatPill", "DEFAULT_DATA_COLUMN_FORMATS"],
					react: 'import { useState } from "@wordpress/element";',
					omit: ["value", "formats"],
					state: (args) => `const [format, setFormat] = useState(${JSON.stringify(args.value)});`,
					extra: ["value={format}", "formats={DEFAULT_DATA_COLUMN_FORMATS}", "onChange={setFormat}"],
				}),
			},
		},
	},
	component: FormatPill,
	render: (args) => <Playground {...args} />,
	args: { value: "number", formats: DEFAULT_DATA_COLUMN_FORMATS },
};

export const Default = {};
