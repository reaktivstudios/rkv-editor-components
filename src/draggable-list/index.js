/**
 * WordPress dependencies
 */
import { __, sprintf } from "@wordpress/i18n";
import { Children, useRef, useState } from "@wordpress/element";
import { speak } from "@wordpress/a11y";

/**
 * External dependencies
 */
import classnames from "classnames";

/**
 * Internal dependencies
 */
import "./editor.scss";

const KEYS = {
	vertical: { previous: "ArrowUp", next: "ArrowDown" },
	horizontal: { previous: "ArrowLeft", next: "ArrowRight" },
};

/**
 * A list whose children can be reordered by dragging, or with the arrow keys
 * while an item is focused.
 *
 * The list doesn't reorder anything itself: it reports each move through
 * `onReorder`, and the parent re-renders the children in their new order.
 *
 * @param {Object}   props
 * @param {Function} props.onReorder     Called with `{ fromIndex, toIndex }` when an item moves.
 * @param {string}   props.orientation   "vertical" or "horizontal"; sets the layout and the arrow keys.
 * @param {string}   props.className     Extra class for the list.
 * @param {Node}     props.children      The items. A child with `draggable={false}` stays in place but can still be dropped on.
 */
const DraggableList = ({
	onReorder,
	orientation = "vertical",
	className,
	children,
	...props
}) => {
	const items = Children.toArray(children);
	const [draggingIndex, setDraggingIndex] = useState(null);
	const [overIndex, setOverIndex] = useState(null);

	// The list element, to refocus an item moved with the keyboard.
	const listRef = useRef(null);

	const announce = (fromIndex, toIndex) => {
		speak(
			sprintf(
				/* translators: 1: previous position, 2: new position. */
				__("Item moved from position %1$d to position %2$d", "rkv-editor-components"),
				fromIndex + 1,
				toIndex + 1,
			),
		);
	};

	const move = (fromIndex, toIndex) => {
		onReorder({ fromIndex, toIndex });
		announce(fromIndex, toIndex);
	};

	const reset = () => {
		setDraggingIndex(null);
		setOverIndex(null);
	};

	const onDragStart = (event, index) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", String(index));

		const rect = event.currentTarget.getBoundingClientRect();
		event.dataTransfer.setDragImage(
			event.currentTarget,
			rect.width / 2,
			rect.height / 2,
		);

		setDraggingIndex(index);
	};

	const onDragOver = (event) => {
		if (null === draggingIndex) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const onDragLeave = (event) => {
		// Moving onto a child of the item isn't leaving it.
		if (!event.currentTarget.contains(event.relatedTarget)) {
			setOverIndex(null);
		}
	};

	const onDrop = (index) => {
		if (null !== draggingIndex && draggingIndex !== index) {
			move(draggingIndex, index);
		}

		reset();
	};

	const onKeyDown = (event, index) => {
		// Leave arrow keys alone inside the items' own controls, such as text fields.
		if (event.target !== event.currentTarget) {
			return;
		}

		const keys = KEYS[orientation] || KEYS.vertical;
		let toIndex = null;

		if (keys.previous === event.key && index > 0) {
			toIndex = index - 1;
		} else if (keys.next === event.key && index < items.length - 1) {
			toIndex = index + 1;
		}

		if (null === toIndex) {
			return;
		}

		event.preventDefault();
		move(index, toIndex);

		// Wait for the parent to re-render, then return focus to the moved item.
		requestAnimationFrame(() => {
			listRef.current
				?.querySelector(`:scope > [data-index="${toIndex}"]`)
				?.focus();
		});
	};

	return (
		<div
			{...props}
			ref={listRef}
			role="list"
			className={classnames(
				"rkv-draggable-list",
				`rkv-draggable-list--${orientation}`,
				{ "has-dragging": null !== draggingIndex },
				className,
			)}
		>
			{items.map((child, index) => {
				const isDraggable = items.length > 1 && false !== child.props?.draggable;

				return (
					<div
						key={child.key}
						role="listitem"
						draggable={isDraggable}
						data-index={index}
						tabIndex={isDraggable ? 0 : undefined}
						onDragStart={(event) => onDragStart(event, index)}
						onDragOver={onDragOver}
						onDragEnter={() => null !== draggingIndex && setOverIndex(index)}
						onDragLeave={onDragLeave}
						onDragEnd={reset}
						onDrop={() => onDrop(index)}
						onKeyDown={isDraggable ? (event) => onKeyDown(event, index) : undefined}
						className={classnames("rkv-draggable-list__item", {
							"is-draggable": isDraggable,
							"is-dragging": draggingIndex === index,
							"is-over": overIndex === index && draggingIndex !== index,
						})}
					>
						{child}
					</div>
				);
			})}
		</div>
	);
};

export default DraggableList;
