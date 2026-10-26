/**
 * WordPress dependencies
 */
import { decodeEntities } from "@wordpress/html-entities";
import { _n, sprintf } from "@wordpress/i18n";
import { ENTER, SPACE } from "@wordpress/keycodes";

/**
 * External dependencies
 */
import classnames from "classnames";

const DefaultItemContent = ({ term, order, getImageUrl }) => {
	const name = decodeEntities(term.name);
	const imageUrl = getImageUrl?.(term);

	return (
		<>
			<div className="term-thumbnail">
				{imageUrl ? (
					<img src={imageUrl} alt="" className="term-thumbnail-image" />
				) : (
					<div className="term-thumbnail-placeholder" aria-hidden="true">
						{name.slice(0, 2).toUpperCase()}
					</div>
				)}
				{null !== order && <div className="term-order-badge">{order}</div>}
			</div>
			<div className="term-title">{name}</div>
			{term.count > 0 && (
				<div className="term-count">
					{sprintf(
						/* translators: %d: number of items assigned to the term. */
						_n("%d item", "%d items", term.count, "rkv-editor-components"),
						term.count,
					)}
				</div>
			)}
		</>
	);
};

const TermCollectionItem = ({
	term,
	isSelected,
	order,
	onClick,
	getImageUrl,
	renderItem,
	view,
}) => {
	const onKeyDown = (event) => {
		if (ENTER === event.keyCode || SPACE === event.keyCode) {
			event.preventDefault();
			onClick();
		}
	};

	return (
		<div
			id={`term-${term.id}`}
			aria-selected={isSelected}
			tabIndex={0}
			role="button"
			onClick={() => onClick()}
			onKeyDown={onKeyDown}
			className={classnames("term-selection-item", {
				"is-selected": isSelected,
			})}
		>
			{renderItem ? (
				renderItem({ term, isSelected, view })
			) : (
				<DefaultItemContent
					term={term}
					order={order}
					getImageUrl={getImageUrl}
				/>
			)}
		</div>
	);
};

export default TermCollectionItem;
