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
import PostCollection from "./post-collection.js";
import "./editor.scss";

const DEFAULT_QUERY_ARGS = {
	per_page: 20,
	context: "view",
};

const EMPTY_ARRAY = [];

/**
 * A modal for searching and selecting posts.
 *
 * Mounts fresh on every open, so `selectedPostIds`, search, and view reset each time.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen          Renders the modal when true.
 * @param {Function} props.onSelect        Called with `(ids, posts)` on insert.
 * @param {Function} props.onClose         Called when the modal is dismissed.
 * @param {Object}   props.queryArgs       `postType` (default "post") plus any REST
 *                                         collection args, e.g. `{ postType: "video", categories: [3] }`.
 * @param {number}   props.postCount       Maximum number of selectable posts.
 * @param {number[]} props.selectedPostIds Post IDs selected when the modal opens.
 * @param {string}   props.title           Overrides the modal title.
 * @param {string}   props.insertLabel     Overrides the insert button text.
 * @param {string}   props.badgeTaxonomy   REST base of a taxonomy whose first term badges each thumbnail.
 * @param {string}   props.imageSize       Featured image size to display.
 * @param {Function} props.renderItem      `({ post, isSelected, view }) => Element` to replace each item's content.
 * @param {string}   props.defaultView     "grid" or "list".
 * @param {string[]} props.views           Available views; the toggle is hidden when only one is given.
 */
const PostModal = ({ isOpen, ...props }) => {
	if (!isOpen) {
		return null;
	}

	return <PostModalContent {...props} />;
};

const PostModalContent = ({
	queryArgs: { postType = "post", ...restQueryArgs } = {},
	onClose,
	onSelect,
	postCount = 1,
	selectedPostIds = EMPTY_ARRAY,
	title,
	insertLabel,
	badgeTaxonomy,
	imageSize = "full",
	renderItem,
	views = ["grid", "list"],
	defaultView = views[0],
}) => {
	const [selectedPosts, setSelectedPosts] = useState(() =>
		selectedPostIds.slice(-postCount),
	);
	const [view, setView] = useState(defaultView);
	const [searchInput, setSearchInput] = useState(restQueryArgs.search || "");
	const [search, setSearch] = useState(searchInput);
	const debouncedSetSearch = useDebounce(setSearch, 300);

	// Post records seen in this session, so `onSelect` can hand back full posts.
	const knownPosts = useRef(new Map());

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

	const { postTypeObject, initialPosts } = useSelect(
		(select) => {
			const { getPostType, getEntityRecords } = select(coreStore);
			return {
				postTypeObject: getPostType(postType),
				initialPosts: selectedPostIds.length
					? getEntityRecords("postType", postType, {
							include: selectedPostIds,
							per_page: selectedPostIds.length,
							context: "view",
						})
					: null,
			};
		},
		[postType, selectedPostIds.join(",")],
	);

	initialPosts?.forEach((post) => knownPosts.current.set(post.id, post));

	const onSearchChange = (value) => {
		setSearchInput(value);
		debouncedSetSearch(value);
	};

	const singlePostTypeLabel =
		postTypeObject?.labels?.singular_name ||
		__("item", "rkv-editor-components");

	const pluralPostTypeLabel =
		postTypeObject?.labels?.name || __("items", "rkv-editor-components");

	const onSelectPost = (post) => {
		knownPosts.current.set(post.id, post);

		if (selectedPosts.includes(post.id)) {
			setSelectedPosts(selectedPosts.filter((id) => id !== post.id));
		} else {
			if (selectedPosts.length < postCount) {
				setSelectedPosts([...selectedPosts, post.id]);
			} else {
				// If the limit is reached, pop off the first selected post.
				setSelectedPosts([...selectedPosts.slice(1), post.id]);
			}
		}
	};

	const onInsert = () => {
		onSelect(
			selectedPosts,
			selectedPosts.map((id) => knownPosts.current.get(id)).filter(Boolean),
		);
	};

	const defaultInsertLabel = selectedPosts.length
		? sprintf(
				/* translators: %s: post type label. */
				__("Insert %s", "rkv-editor-components"),
				selectedPosts.length > 1 ? pluralPostTypeLabel : singlePostTypeLabel,
			)
		: sprintf(
				/* translators: %s: post type singular label. */
				__("Select %s", "rkv-editor-components"),
				singlePostTypeLabel,
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
				disabled={0 === selectedPosts.length}
			>
				{insertLabel || defaultInsertLabel}
			</Button>
		</HStack>
	);

	return (
		<Modal
			size="large"
			className="rkv-post-select-modal"
			bodyOpenClassName="rkv-post-select-modal-open"
			headerActions={headerActions}
			title={
				title ||
				sprintf(
					/* translators: %s: post type singular label. */
					__("Select %s", "rkv-editor-components"),
					singlePostTypeLabel,
				)
			}
			onRequestClose={onClose}
		>
			<div
				className={`post-select-modal__content post-select-modal__content--${view}`}
			>
				<SearchControl
					__nextHasNoMarginBottom
					value={searchInput}
					placeholder={__("Search...", "rkv-editor-components")}
					onChange={onSearchChange}
				/>
				<PostCollection
					postType={postType}
					queryArgs={queryArgs}
					selectedPosts={selectedPosts}
					onSelectPost={onSelectPost}
					view={view}
					badgeTaxonomy={badgeTaxonomy}
					imageSize={imageSize}
					renderItem={renderItem}
				/>
			</div>
		</Modal>
	);
};

export default PostModal;
