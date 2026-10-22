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
import DataTableEditor from "./index.js";

const DATA = [
	["Region", "Revenue", "Share", "Year"],
	["North", "$1,200", "42%", "2024"],
	["South", "$900", "31%", "2024"],
	["West", "$800", "27%", "2024"],
];

const Playground = ({ onSave, onClose, ...args }) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<Button variant="primary" onClick={() => setIsOpen(true)}>
				Edit data
			</Button>
			{isOpen && (
				<DataTableEditor
					{...args}
					onSave={(...result) => {
						onSave(...result);
						setIsOpen(false);
					}}
					onClose={() => {
						onClose();
						setIsOpen(false);
					}}
				/>
			)}
		</>
	);
};

export default {
	title: "Components/DataTableEditor",
	component: DataTableEditor,
	render: (args) => <Playground {...args} />,
	args: {
		data: DATA,
		columnFormats: ["text", "usd", "percent", "year"],
		onSave: fn(),
		onClose: fn(),
	},
};

export const Default = {};
export const ReadOnly = { args: { readOnly: true } };
