/**
 * Internal dependencies.
 */
import "./editor.scss";

/**
 * A small circle that previews a style: its color, outline color,
 * line style and fill style.
 *
 * @param {Object} props
 * @param {string} props.color        Fill color, if any.
 * @param {string} props.outlineColor Outline color, if any; otherwise the circle has no colored ring.
 * @param {string} props.lineStyle    Line style slug; anything but solid draws a dashed or dotted ring.
 * @param {string} props.fillStyle    Fill style slug.
 * @param {string} props.className    Extra class names.
 */
export default function StyleIndicator({
	color,
	outlineColor,
	lineStyle = "solid",
	fillStyle = "solid",
	className,
}) {
	return (
		<span
			className={[
				"rkv-style-indicator",
				!color && "is-empty",
				outlineColor && "has-outline",
				lineStyle !== "solid" && `has-line-style is-line-${lineStyle}`,
				`is-fill-${fillStyle}`,
				className,
			]
				.filter(Boolean)
				.join(" ")}
			style={{
				...(color && { "--rkv-style-indicator--color": color }),
				...(outlineColor && {
					"--rkv-style-indicator--outline": outlineColor,
				}),
			}}
		/>
	);
}
