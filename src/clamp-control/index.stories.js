/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";

/**
 * Internal dependencies
 */
import ClampControl from "./index.js";
import { js, usage } from "../../.storybook/usage.js";

const Playground = ({ value: initial, ...args }) => {
	const [value, setValue] = useState(initial);
	return (
		<div style={{ width: 280 }}>
			<ClampControl {...args} value={value} onChange={setValue} />
		</div>
	);
};

export default {
	title: "Components/ClampControl",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["ClampControl"],
					react: 'import { useState } from "@wordpress/element";',
					omit: ["value"],
					state: (args) => `const [value, setValue] = useState(${js(args.value)});`,
					extra: ["value={value}", "onChange={setValue}"],
				}),
			},
		},
	},
	component: ClampControl,
	render: (args) => <Playground {...args} />,
	args: {
		label: "Font size",
		help: "Grows with the viewport between the minimum and maximum.",
		value: { min: 16, ideal: 24, max: 40 },
		rangeMin: 8,
		rangeMax: 64,
		unit: "px",
	},
};

export const Default = {};
export const WithReset = { args: { allowReset: true } };
export const WithMarks = {
	args: {
		marks: true,
		step: 8,
		rangeMin: 0,
		value: { min: 8, ideal: 24, max: 40 },
	},
};
export const Disabled = { args: { disabled: true } };
