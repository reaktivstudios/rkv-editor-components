/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
import { useCallback, useEffect, useState } from "@wordpress/element";
import { useRegistry } from "@wordpress/data";
import { __experimentalLinkControlSearchInput as LinkControlSearchInput } from "@wordpress/block-editor";
import { BaseControl } from "@wordpress/components";

/**
 * External dependencies
 */
import classnames from "classnames";

/**
 * Internal dependencies
 */
import fetchPostSuggestions from "./fetch-post-suggestions.js";
import "./editor.scss";

/**
 * A search field that suggests posts matching `queryArgs` and selects one.
 *
 * @param {Object}   props
 * @param {Object}   props.queryArgs              `postType` (a slug or array of slugs) plus any REST
 *                                                collection args, e.g. `{ postType: ["post", "video"], categories: [3] }`.
 * @param {number}   props.value                  Selected post ID.
 * @param {Function} props.onChange               Called with `(id, suggestion)`, or `(null, null)` when cleared.
 * @param {string}   props.label                  Field label.
 * @param {string}   props.help                   Help text below the field.
 * @param {string}   props.placeholder            Input placeholder.
 * @param {boolean}  props.hideLabelFromVision    Visually hides the label.
 * @param {boolean}  props.showInitialSuggestions Shows suggestions on focus, before anything is typed.
 * @param {string}   props.className              Additional class name.
 */
const PostSearchField = ({
	queryArgs = {},
	value,
	onChange,
	label = __("Search & Add", "rkv-editor-components"),
	help,
	placeholder = __("Search...", "rkv-editor-components"),
	hideLabelFromVision = false,
	showInitialSuggestions = true,
	className,
}) => {
	const registry = useRegistry();
	const [inputValue, setInputValue] = useState("");
	const [selected, setSelected] = useState(null);

	// Serialize so a new-but-equal object from the caller keeps the same fetcher.
	const queryArgsKey = JSON.stringify(queryArgs);

	const fetchSuggestions = useCallback(
		(search) => fetchPostSuggestions(registry, search, queryArgs),
		[registry, queryArgsKey],
	);

	// Show the title of a post selected before this field mounted, or clear
	// the field when the parent clears `value`.
	useEffect(() => {
		if (!value) {
			setSelected(null);
			setInputValue("");
			return;
		}

		if (selected?.id === value) {
			return;
		}

		let isCurrent = true;

		fetchPostSuggestions(registry, "", {
			...queryArgs,
			include: [value],
			orderby: "include",
		}).then(([suggestion]) => {
			if (isCurrent && suggestion) {
				setSelected(suggestion);
				setInputValue(suggestion.title);
			}
		});

		return () => {
			isCurrent = false;
		};
	}, [value]);

	const handleInputChange = (nextValue) => {
		setInputValue(nextValue);

		if (!nextValue && value) {
			setSelected(null);
			onChange(null, null);
		}
	};

	const handleSelect = (suggestion) => {
		// Pressing Enter without choosing a suggestion submits just the typed text.
		if (!suggestion?.id) {
			return;
		}

		setSelected(suggestion);
		setInputValue(suggestion.title);
		onChange(suggestion.id, suggestion);
	};

	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={label}
			help={help}
			hideLabelFromVision={hideLabelFromVision}
			className={classnames("rkv-post-search-field", className)}
		>
			<LinkControlSearchInput
				value={inputValue}
				// Keeps suggestions closed while the input shows the selected title.
				currentLink={selected ? { url: selected.title } : {}}
				placeholder={placeholder}
				hideLabelFromVision
				onChange={handleInputChange}
				onSelect={handleSelect}
				fetchSuggestions={fetchSuggestions}
				showInitialSuggestions={showInitialSuggestions}
				allowDirectEntry={false}
				withURLSuggestion={false}
				withCreateSuggestion={false}
			/>
		</BaseControl>
	);
};

export default PostSearchField;
