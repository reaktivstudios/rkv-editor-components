/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import { RangeControl } from "@wordpress/components";

/**
 * Internal dependencies
 */
import LinkedControls from "./index.js";
import { usage } from "../../.storybook/usage.js";

const Playground = (args) => {
	const [values, setValues] = useState({ x: 4, y: 4 });
	return (
		<div style={{ width: 280 }}>
			<LinkedControls {...args} values={values} onChange={setValues}>
				{({ label, value, onChange }) => (
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={label}
						value={value}
						onChange={onChange}
						min={0}
						max={20}
					/>
				)}
			</LinkedControls>
		</div>
	);
};

export default {
	title: "Components/LinkedControls",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["LinkedControls"],
					react: 'import { useState } from "@wordpress/element";\nimport { RangeControl } from "@wordpress/components";',
					state: "const [values, setValues] = useState({ x: 4, y: 4 });",
					extra: ["values={values}", "onChange={setValues}"],
					children: `{({ label, value, onChange }) => (
	<RangeControl
		label={label}
		value={value}
		onChange={onChange}
		min={0}
		max={20}
	/>
)}`,
				}),
			},
		},
	},
	component: LinkedControls,
	render: (args) => <Playground {...args} />,
	args: {
		linkedLabel: "Distance",
		fields: [
			{ key: "x", label: "Horizontal" },
			{ key: "y", label: "Vertical" },
		],
	},
};

export const Default = {};
