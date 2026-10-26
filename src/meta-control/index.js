/**
 * WordPress dependencies
 */
import {
	CheckboxControl,
	ColorPalette,
	RadioControl,
	RangeControl,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from "@wordpress/components";

/**
 * Internal dependencies
 */
import useMetaValue from "./use-meta-value.js";

// What each type renders, which prop carries its value, and the value shown
// while the meta is unset.
const TYPES = {
	text: {
		Control: TextControl,
		valueProp: "value",
		empty: "",
		props: { __nextHasNoMarginBottom: true, __next40pxDefaultSize: true },
	},
	textarea: {
		Control: TextareaControl,
		valueProp: "value",
		empty: "",
		props: { __nextHasNoMarginBottom: true },
	},
	toggle: {
		Control: ToggleControl,
		valueProp: "checked",
		empty: false,
		props: { __nextHasNoMarginBottom: true },
	},
	checkbox: {
		Control: CheckboxControl,
		valueProp: "checked",
		empty: false,
		props: { __nextHasNoMarginBottom: true },
	},
	select: {
		Control: SelectControl,
		valueProp: "value",
		empty: "",
		props: { __nextHasNoMarginBottom: true, __next40pxDefaultSize: true },
	},
	radio: {
		Control: RadioControl,
		valueProp: "selected",
		empty: "",
		props: {},
	},
	range: {
		Control: RangeControl,
		valueProp: "value",
		empty: undefined,
		props: { __nextHasNoMarginBottom: true, __next40pxDefaultSize: true },
	},
	color: {
		Control: ColorPalette,
		valueProp: "value",
		empty: undefined,
		props: {},
	},
};

/**
 * A form control bound to a post meta value: it shows the value, and edits it
 * as the post's unsaved changes.
 *
 * @param {Object}        props
 * @param {string}        props.metaKey   The meta key. It has to be registered with `show_in_rest`.
 * @param {string}        props.type      "text" (default), "textarea", "toggle", "checkbox", "select", "radio", "range", or "color".
 * @param {Function}      props.onChange  Called with the new value after the meta is updated.
 * @param {string}        props.postType  Post type of the record. Defaults to the post being edited.
 * @param {number|string} props.postId    ID of the record. Defaults to the post being edited.
 *
 * Every other prop goes to the underlying control, such as `label`, `help`, `options`, `min`, or `max`.
 */
const MetaControl = ({
	metaKey,
	type = "text",
	onChange,
	postType,
	postId,
	...props
}) => {
	const [value, setValue] = useMetaValue(metaKey, { postType, postId });

	const { Control, valueProp, empty, props: defaults } = TYPES[type] || TYPES.text;

	return (
		<Control
			{...defaults}
			{...props}
			{...{ [valueProp]: value ?? empty }}
			onChange={(next) => {
				setValue(next);
				onChange?.(next);
			}}
		/>
	);
};

export default MetaControl;
export { useMetaValue };
