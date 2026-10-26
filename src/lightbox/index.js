/**
 * WordPress dependencies
 */
import { __, isRTL, sprintf } from "@wordpress/i18n";
import { Button, Modal } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { chevronLeft, chevronRight } from "@wordpress/icons";

/**
 * External dependencies
 */
import classnames from "classnames";

/**
 * Internal dependencies
 */
import "./editor.scss";

/**
 * A modal that shows images, videos, or embeds one at a time, with previous and
 * next buttons, dots, arrow-key navigation, and a caption.
 *
 * Mounts fresh on every open, so the current item resets each time. It doesn't
 * collect media itself: pass in the elements to show.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen       Renders the lightbox when true.
 * @param {Function} props.onClose      Called when the lightbox is dismissed.
 * @param {Array}    props.items        `{ content, caption }` objects. `content` is any node, such as an `<img>` or `<iframe>`; `caption` is an optional node shown beside it.
 * @param {number}   props.initialIndex Index of the item shown first.
 * @param {string}   props.label        Accessible name for the dialog.
 * @param {string}   props.className    Extra class for the dialog.
 */
const Lightbox = ({ isOpen, ...props }) => {
	if (!isOpen) {
		return null;
	}

	return <LightboxContent {...props} />;
};

const LightboxContent = ({
	items = [],
	initialIndex = 0,
	label = __("Media viewer", "rkv-editor-components"),
	className,
	onClose,
}) => {
	const count = items.length;
	const [currentIndex, setCurrentIndex] = useState(
		Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)),
	);

	const goTo = (offset) =>
		setCurrentIndex((index) => (index + offset + count) % count);

	// Arrow keys step through the items; the one pointing "forward" follows the text direction.
	useEffect(() => {
		if (count < 2) {
			return undefined;
		}

		const onKeyDown = (event) => {
			const forward = isRTL() ? "ArrowLeft" : "ArrowRight";
			const backward = isRTL() ? "ArrowRight" : "ArrowLeft";

			if (forward === event.key) {
				goTo(1);
			} else if (backward === event.key) {
				goTo(-1);
			}
		};

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, [count]);

	const caption = items[currentIndex]?.caption;

	return (
		<Modal
			size="fill"
			className={classnames("rkv-lightbox", className)}
			contentLabel={label}
			onRequestClose={onClose}
			style={{ "--rkv-lightbox-index": currentIndex }}
		>
			<div className="rkv-lightbox__media">
				<div className="rkv-lightbox__items">
					{items.map((item, index) => (
						<div
							key={index}
							className="rkv-lightbox__item"
							aria-hidden={index !== currentIndex}
						>
							{item.content}
						</div>
					))}
				</div>
				{count > 1 && (
					<div className="rkv-lightbox__dots">
						{items.map((_, index) => (
							<button
								key={index}
								type="button"
								className={classnames("rkv-lightbox__dot", {
									"is-active": index === currentIndex,
								})}
								aria-label={sprintf(
									/* translators: 1: item number, 2: total number of items. */
									__("Show item %1$d of %2$d", "rkv-editor-components"),
									index + 1,
									count,
								)}
								aria-current={index === currentIndex}
								onClick={() => setCurrentIndex(index)}
							/>
						))}
					</div>
				)}
			</div>
			<div className="rkv-lightbox__content">
				{caption && (
					<div className="rkv-lightbox__caption" aria-live="polite">
						{caption}
					</div>
				)}
				{count > 1 && (
					<div className="rkv-lightbox__navigation">
						<Button
							variant="secondary"
							icon={isRTL() ? chevronRight : chevronLeft}
							label={__("Previous", "rkv-editor-components")}
							onClick={() => goTo(-1)}
						/>
						<Button
							variant="secondary"
							icon={isRTL() ? chevronLeft : chevronRight}
							label={__("Next", "rkv-editor-components")}
							onClick={() => goTo(1)}
						/>
					</div>
				)}
			</div>
		</Modal>
	);
};

export default Lightbox;
