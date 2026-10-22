/**
 * Internal dependencies
 */
import StyleIndicator from "./index.js";
import { usage } from "../../.storybook/usage.js";

export default {
	title: "Components/StyleIndicator",
	component: StyleIndicator,
	parameters: {
		docs: { source: { transform: usage({ imports: ["StyleIndicator"] }) } },
	},
	args: { color: "#3858e9" },
};

export const Default = {};
export const Empty = { args: { color: undefined } };
export const WithOutline = { args: { outlineColor: "#cc1818" } };
export const Dashed = { args: { lineStyle: "dashed" } };
export const Dotted = {
	args: { lineStyle: "dotted", outlineColor: "#007017" },
};
