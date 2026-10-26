/**
 * WordPress dependencies.
 */
import { useMemo, useRef, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";
import {
	Modal,
	Button,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from "@wordpress/components";
import { listView, grid } from "@wordpress/icons";
import { useSelect } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data";
import { useDebounce } from "@wordpress/compose";

/**
 * Internal dependencies.
 */
import TermCollection from "./term-collection.js";
import "./editor.scss";

const DEFAULT_QUERY_ARGS = {
	per_page: 50,
	context: "view",
	orderby: "name",
	order: "asc",
	hide_empty: false,
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * A modal for searching and selecting taxonomy terms.
 *
 * Mounts fresh on every open, so `selectedTermIds`, search, and view reset each time.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen          Renders the modal when true.
 * @param {Function} props.onSelect        Called with `(ids, terms)` on insert.
 * @param {Function} props.onClose         Called when the modal is dismissed.
 * @param {string}   props.taxonomy        Taxonomy slug (default "category").
 * @param {Object}   props.queryArgs       REST collection args for the taxonomy, e.g. `{ parent: 0, hide_empty: true }`.
 * @param {number}   props.termCount       Maximum number of selectable terms.
 * @param {number[]} props.selectedTermIds Term IDs selected when the modal opens.
 * @param {string}   props.title           Overrides the modal title.
 * @param {string}   props.insertLabel     Overrides the insert button text.
 * @param {Function} props.getImageUrl     `(term) => string` returning a thumbnail URL for a term.
 * @param {Function} props.renderItem      `({ term, isSelected, view }) => Element` to replace each item's content.
 * @param {string}   props.defaultView     "grid" or "list".
 * @param {string[]} props.views           Available views; the toggle is hidden when only one is given.
 */
const TermSelectModal = ({ isOpen, ...props }) => {
	if (!isOpen) {
		return null;
	}

	return <TermSelectModalContent {...props} />;
};

const TermSelectModalContent = ({
	taxonomy = "category",
	queryArgs: restQueryArgs = EMPTY_OBJECT,
	onClose,
	onSelect,
	termCount = 1,
	selectedTermIds = EMPTY_ARRAY,
	title,
	insertLabel,
	getImageUrl,
	renderItem,
	views = ["grid", "list"],
	defaultView = views[0],
}) => {
	const [selectedTerms, setSelectedTerms] = useState(() =>
		selectedTermIds.slice(-termCount),
	);
	const [view, setView] = useState(defaultView);
	const [searchInput, setSearchInput] = useState(restQueryArgs.search || "");
	const [search, setSearch] = useState(searchInput);
	const debouncedSetSearch = useDebounce(setSearch, 300);

	// Term records seen in this session, so `onSelect` can hand back full terms.
	const knownTerms = useRef(new Map());

	// Serialize so a new-but-equal object from the caller doesn't reset the collection.
	const restQueryArgsKey = JSON.stringify(restQueryArgs);
	const queryArgs = useMemo(
		() => ({
			...DEFAULT_QUERY_ARGS,
			...restQueryArgs,
			...(search ? { search } : {}),
		}),
		[restQueryArgsKey, search],
	);

	const { taxonomyObject, initialTerms } = useSelect(
		(select) => {
			const { getTaxonomy, getEntityRecords } = select(coreStore);
			return {
				taxonomyObject: getTaxonomy(taxonomy),
				initialTerms: selectedTermIds.length
					? getEntityRecords("taxonomy", taxonomy, {
							include: selectedTermIds,
							per_page: selectedTermIds.length,
							context: "view",
						})
					: null,
			};
		},
		[taxonomy, selectedTermIds.join(",")],
	);

	initialTerms?.forEach((term) => knownTerms.current.set(term.id, term));

	const onSearchChange = (value) => {
		setSearchInput(value);
		debouncedSetSearch(value);
	};

	const singleLabel =
		taxonomyObject?.labels?.singular_name ||
		__("term", "rkv-editor-components");

	const pluralLabel =
		taxonomyObject?.labels?.name || __("terms", "rkv-editor-components");

	const onToggleTerm = (term) => {
		knownTerms.current.set(term.id, term);

		if (selectedTerms.includes(term.id)) {
			setSelectedTerms(selectedTerms.filter((id) => id !== term.id));
		} else if (selectedTerms.length < termCount) {
			setSelectedTerms([...selectedTerms, term.id]);
		} else {
			// If the limit is reached, pop off the first selected term.
			setSelectedTerms([...selectedTerms.slice(1), term.id]);
		}
	};

	const onInsert = () => {
		onSelect(
			selectedTerms,
			selectedTerms.map((id) => knownTerms.current.get(id)).filter(Boolean),
		);
	};

	const defaultInsertLabel = selectedTerms.length
		? sprintf(
				/* translators: %s: taxonomy label. */
				__("Insert %s", "rkv-editor-components"),
				selectedTerms.length > 1 ? pluralLabel : singleLabel,
			)
		: sprintf(
				/* translators: %s: taxonomy singular label. */
				__("Select %s", "rkv-editor-components"),
				singleLabel,
			);

	const viewOptions = {
		grid: { icon: grid, label: __("Grid View", "rkv-editor-components") },
		list: { icon: listView, label: __("List View", "rkv-editor-components") },
	};

	const headerActions = (
		<HStack spacing={8} className="modal-header-actions">
			{views.length > 1 && (
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					isDeselectable={false}
					hideLabelFromVision
					label={__("View", "rkv-editor-components")}
					value={view}
					onChange={(value) => setView(value)}
					isBlock={false}
					className="view-toggle"
				>
					{views.map((value) => (
						<ToggleGroupControlOptionIcon
							key={value}
							value={value}
							icon={viewOptions[value].icon}
							label={viewOptions[value].label}
						/>
					))}
				</ToggleGroupControl>
			)}
			<Button
				variant="primary"
				onClick={onInsert}
				disabled={0 === selectedTerms.length}
			>
				{insertLabel || defaultInsertLabel}
			</Button>
		</HStack>
	);

	return (
		<Modal
			size="large"
			className="rkv-term-select-modal"
			bodyOpenClassName="rkv-term-select-modal-open"
			headerActions={headerActions}
			title={
				title ||
				sprintf(
					/* translators: %s: taxonomy singular label. */
					__("Select %s", "rkv-editor-components"),
					singleLabel,
				)
			}
			onRequestClose={onClose}
		>
			<div
				className={`term-select-modal__content term-select-modal__content--${view}`}
			>
				<SearchControl
					__nextHasNoMarginBottom
					value={searchInput}
					placeholder={__("Search...", "rkv-editor-components")}
					onChange={onSearchChange}
				/>
				<TermCollection
					taxonomy={taxonomy}
					queryArgs={queryArgs}
					selectedTerms={selectedTerms}
					onToggleTerm={onToggleTerm}
					view={view}
					showOrder={termCount > 1}
					getImageUrl={getImageUrl}
					renderItem={renderItem}
				/>
			</div>
		</Modal>
	);
};

export default TermSelectModal;
