/**
 * WordPress dependencies.
 */
import {
	BaseControl,
	Button,
	__experimentalNumberControl as NumberControl,
} from "@wordpress/components";
import { useInstanceId } from "@wordpress/compose";
import { Fragment, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

/**
 * Internal dependencies.
 */
import "./editor.scss";

const THUMB_SIZE = 12;

const THUMBS = [
	{
		key: "min",
		shape: "min",
		glyph: "▶",
		label: __("Minimum", "rkv-editor-components"),
	},
	{
		key: "ideal",
		shape: "ideal",
		glyph: "●",
		label: __("Ideal", "rkv-editor-components"),
	},
	{
		key: "max",
		shape: "max",
		glyph: "◀",
		label: __("Maximum", "rkv-editor-components"),
	},
];

/**
 * A RangeControl with three thumbs, like CSS clamp(): a floor (▶), the
 * preferred value (●) and a ceiling (◀). The thumbs can't cross.
 *
 * @param {Object}        props
 * @param {string}        props.label                Control label.
 * @param {string}        props.help                 Explains how the three values combine.
 * @param {Object}        props.value                { min, ideal, max }.
 * @param {Function}      props.onChange             ( { min, ideal, max } ) => void.
 * @param {number}        props.rangeMin             Lowest allowed value.
 * @param {number}        props.rangeMax             Highest allowed value.
 * @param {number}        props.step                 Step between values.
 * @param {string}        props.unit                 Shown after each value.
 * @param {boolean}       props.withInputField       Show a number field per thumb, as RangeControl does.
 * @param {boolean}       props.allowReset           Show a Reset button.
 * @param {Object}        props.resetFallbackValue   { min, ideal, max } Reset sets; defaults to the range ends.
 * @param {boolean}       props.disabled             Dim the control and ignore input.
 * @param {boolean}       props.showTooltip          Show the value above a focused thumb (default true).
 * @param {Function}      props.renderTooltipContent ( value ) => node for the tooltip.
 * @param {boolean|Array} props.marks                true for a tick at every step, or [ { value, label? } ].
 * @param {boolean}       props.hideLabelFromVision  Hide the label visually.
 * @param {string}        props.className            Added to the control.
 */
export default function ClampControl({
	label,
	help,
	value,
	onChange,
	rangeMin = 0,
	rangeMax = 100,
	step = 1,
	unit = "px",
	withInputField = true,
	allowReset = false,
	resetFallbackValue,
	disabled = false,
	showTooltip = true,
	renderTooltipContent = (v) => v,
	marks = false,
	hideLabelFromVision = false,
	className,
}) {
	const id = useInstanceId(ClampControl, "rkv-clamp-control");
	const { min, ideal, max } = value;
	const fallback = resetFallbackValue ?? {
		min: rangeMin,
		ideal: rangeMin,
		max: rangeMax,
	};

	const markList =
		marks === true
			? Array.from(
					{
						length: Math.floor((rangeMax - rangeMin) / step) + 1,
					},
					(_, i) => ({ value: rangeMin + i * step }),
				)
			: marks || [];

	const trackRef = useRef(null);
	const dragging = useRef(null);

	const update = (key, raw) => {
		const next = { ...value, [key]: Number(raw) };
		// Push the neighbors along instead of letting thumbs cross.
		if (key === "min") {
			next.ideal = Math.max(next.ideal, next.min);
			next.max = Math.max(next.max, next.ideal);
		} else if (key === "ideal") {
			next.min = Math.min(next.min, next.ideal);
			next.max = Math.max(next.max, next.ideal);
		} else {
			next.ideal = Math.min(next.ideal, next.max);
			next.min = Math.min(next.min, next.ideal);
		}
		onChange(next);
	};

	const valueAt = (clientX) => {
		const { left, width } = trackRef.current.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
		const raw = rangeMin + ratio * (rangeMax - rangeMin);
		return Math.min(
			rangeMax,
			Math.max(rangeMin, Math.round(raw / step) * step),
		);
	};

	// Where a thumb's drawn shape sits, in px from the rail's left edge: the dot
	// is centered on its value, the triangles hang off it.
	const SHAPE_OFFSET = { min: 0, ideal: -THUMB_SIZE / 2, max: -THUMB_SIZE };

	// All pointer input goes through the track, since the hidden inputs' own
	// thumbs can't follow the triangles' offset. A press on a thumb grabs it
	// where it is; a press on the rail sends the nearest thumb there. Either follows the drag.
	const onRailDown = (event) => {
		if (disabled) {
			return;
		}
		const { left, width } = trackRef.current.getBoundingClientRect();
		const x = event.clientX - left;
		const anchor = (key) => (percent(value[key]) / 100) * width;
		const grabbed = THUMBS.map(({ key }) => ({
			key,
			from: anchor(key) + SHAPE_OFFSET[key],
		}))
			.filter(({ from }) => x >= from && x <= from + THUMB_SIZE)
			.sort(
				(a, b) =>
					Math.abs(x - a.from - THUMB_SIZE / 2) -
					Math.abs(x - b.from - THUMB_SIZE / 2),
			)[0];

		let key = grabbed?.key;
		let offset = grabbed ? x - anchor(key) : 0;
		if (!key) {
			const at = valueAt(event.clientX);
			// Nearest thumb wins; on a tie (e.g. all stacked) the one on the clicked side.
			const order =
				at < ideal ? ["min", "ideal", "max"] : ["max", "ideal", "min"];
			key = order.reduce((best, k) =>
				Math.abs(at - value[k]) < Math.abs(at - value[best]) ? k : best,
			);
			offset = 0;
			update(key, at);
		}
		dragging.current = { key, offset };
		event.currentTarget.setPointerCapture(event.pointerId);
		document.getElementById(`${id}-${key}`)?.focus();
		event.preventDefault();
	};
	const onRailMove = (event) => {
		if (dragging.current) {
			const { key, offset } = dragging.current;
			update(key, valueAt(event.clientX - offset));
		}
	};
	const onRailUp = () => {
		dragging.current = null;
	};

	const percent = (n) => ((n - rangeMin) / (rangeMax - rangeMin)) * 100;

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={`${id}-min`}
			label={label}
			hideLabelFromVision={hideLabelFromVision}
			help={help}
			className={[
				"rkv-clamp-control",
				disabled && "is-disabled",
				markList.length > 0 && "is-marked",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div
				ref={trackRef}
				className="rkv-clamp-control__track"
				onPointerDown={onRailDown}
				onPointerMove={onRailMove}
				onPointerUp={onRailUp}
				onPointerCancel={onRailUp}
				style={{
					"--rkv-clamp-from": `${percent(min)}%`,
					"--rkv-clamp-to": `${percent(max)}%`,
				}}
			>
				{markList.map((mark) => {
					const at = { left: `${percent(mark.value)}%` };
					const filled = mark.value >= min && mark.value <= max;
					return (
						<Fragment key={mark.value}>
							<span
								className={`rkv-clamp-control__mark${
									filled ? " is-filled" : ""
								}`}
								style={at}
								aria-hidden="true"
							/>
							{mark.label && (
								<span
									className={`rkv-clamp-control__mark-label${
										filled ? " is-filled" : ""
									}`}
									style={at}
									aria-hidden="true"
								>
									{mark.label}
								</span>
							)}
						</Fragment>
					);
				})}
				{THUMBS.map(({ key, shape, label: thumbLabel }) => (
					<Fragment key={key}>
						<input
							id={`${id}-${key}`}
							className={`rkv-clamp-control__input is-${shape}`}
							type="range"
							aria-label={`${label}: ${thumbLabel}`}
							min={rangeMin}
							max={rangeMax}
							step={step}
							disabled={disabled}
							value={value[key]}
							onChange={(event) => update(key, event.target.value)}
						/>
						{/* Core's RangeControl does the same: a transparent input drives a drawn thumb. */}
						<span
							className={`rkv-clamp-control__thumb is-${shape}`}
							style={{ left: `${percent(value[key])}%` }}
							aria-hidden="true"
						>
							<span className="rkv-clamp-control__shape" />
							{showTooltip && (
								<span className="rkv-clamp-control__tooltip">
									{renderTooltipContent(value[key])}
								</span>
							)}
						</span>
					</Fragment>
				))}
			</div>
			{withInputField ? (
				<div className="rkv-clamp-control__fields">
					{THUMBS.map(({ key, glyph, label: thumbLabel }) => (
						<NumberControl
							key={key}
							className="rkv-clamp-control__field"
							__next40pxDefaultSize
							label={`${glyph} ${thumbLabel}`}
							hideLabelFromVision
							prefix={<span className="rkv-clamp-control__glyph">{glyph}</span>}
							suffix={<span className="rkv-clamp-control__unit">{unit}</span>}
							spinControls="none"
							disabled={disabled}
							min={rangeMin}
							max={rangeMax}
							step={step}
							value={value[key]}
							onChange={(next) => {
								if (next === "" || next === undefined) {
									return;
								}
								update(
									key,
									Math.min(rangeMax, Math.max(rangeMin, Number(next))),
								);
							}}
						/>
					))}
				</div>
			) : (
				<div className="rkv-clamp-control__values" aria-hidden="true">
					{THUMBS.map(({ key, glyph }) => (
						<span key={key}>
							{key === "max" ? "" : `${glyph} `}
							{value[key]}
							{unit}
							{key === "max" ? ` ${glyph}` : ""}
						</span>
					))}
				</div>
			)}
			{allowReset && (
				<Button
					className="rkv-clamp-control__reset"
					variant="secondary"
					size="small"
					disabled={
						disabled || THUMBS.every(({ key }) => value[key] === fallback[key])
					}
					onClick={() => onChange(fallback)}
				>
					{__("Reset", "rkv-editor-components")}
				</Button>
			)}
		</BaseControl>
	);
}
