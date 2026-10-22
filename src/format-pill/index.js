/**
 * WordPress dependencies.
 */
import { __ } from "@wordpress/i18n";
import { DropdownMenu } from "@wordpress/components";

/**
 * Internal dependencies.
 */
import "./editor.scss";

/**
 * Pill showing a column's format; opens a menu to choose another.
 *
 * @param {Object}   props
 * @param {string}   props.value         Current format slug.
 * @param {Object}   props.formats       Format definitions keyed by slug: { label, preview }.
 * @param {Function} props.onChange      Called with the chosen slug.
 * @param {string}   props.defaultFormat Slug shown when `value` isn't in `formats`.
 * @param {string}   props.label         Accessible label for the pill.
 */
export default function FormatPill({
	value,
	formats,
	onChange,
	defaultFormat = "text",
	label = __("Column format", "rkv-editor-components"),
}) {
	const current = formats[value] ?? formats[defaultFormat];

	return (
		<DropdownMenu
			className="rkv-format-pill"
			icon={null}
			text={current?.label ?? value}
			label={label}
			toggleProps={{ className: "rkv-format-pill__toggle" }}
			popoverProps={{ placement: "bottom-start" }}
			controls={Object.entries(formats).map(([slug, def]) => ({
				title: (
					<span className="rkv-format-pill__item">
						<span>{def.label}</span>
						<span className="rkv-format-pill__preview">{def.preview}</span>
					</span>
				),
				role: "menuitemradio",
				isActive: slug === value,
				onClick: () => onChange(slug),
			}))}
		/>
	);
}
