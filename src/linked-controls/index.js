/**
 * WordPress dependencies.
 */
import { Button } from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { link, linkOff } from "@wordpress/icons";

/**
 * Internal dependencies.
 */
import "./editor.scss";

/**
 * Renders one control for both values (x and y) until the user unlinks them, then one per value.
 * Starts unlinked when the two values already differ.
 *
 * @param {Object}   props
 * @param {Object}   props.values      { x, y } current values.
 * @param {Function} props.onChange    ( { x, y } ) => void. Linked edits send the same value for both.
 * @param {Array}    props.fields      [ { key: 'x'|'y', label } ] label for each value when unlinked.
 * @param {string}   props.linkedLabel Control label while linked.
 * @param {string}   props.unlinkLabel Toggle label while linked.
 * @param {string}   props.linkLabel   Toggle label while unlinked.
 * @param {Function} props.children    ( { label, value, onChange } ) => control.
 */
export default function LinkedControls({
	values,
	onChange,
	fields,
	linkedLabel,
	unlinkLabel = __("Unlink values", "rkv-editor-components"),
	linkLabel = __("Link values", "rkv-editor-components"),
	children,
}) {
	const [linked, setLinked] = useState(values.x === values.y);

	return (
		<div className="rkv-linked-controls">
			<Button
				className="rkv-linked-controls__toggle"
				icon={linked ? link : linkOff}
				iconSize={24}
				size="small"
				label={linked ? unlinkLabel : linkLabel}
				aria-pressed={!linked}
				onClick={() => {
					// Relinking makes both match the X value.
					if (!linked) {
						onChange({ x: values.x, y: values.x });
					}
					setLinked(!linked);
				}}
			/>
			{linked
				? children({
						label: linkedLabel,
						value: values.x,
						onChange: (value) => onChange({ x: value, y: value }),
					})
				: fields.map(({ key: axis, label }) => (
						<div key={axis} className="rkv-linked-controls__axis">
							{children({
								label,
								value: values[axis],
								onChange: (value) => onChange({ ...values, [axis]: value }),
							})}
						</div>
					))}
		</div>
	);
}
