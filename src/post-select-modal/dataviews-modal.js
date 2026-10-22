/**
 * WordPress dependencies.
 */
import { useMemo, useRef, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { store as coreStore, useEntityRecords } from "@wordpress/core-data";
import { decodeEntities } from "@wordpress/html-entities";
import { dateI18n, getSettings } from "@wordpress/date";
import { DataViewsPicker } from "@wordpress/dataviews";
import "@wordpress/dataviews/build-style/style.css";

const EMPTY_ARRAY = [];

const BADGE_STYLE = {
	background: "var(--wp-components-color-accent-inverted, #fff)",
	borderRadius: 4,
	bottom: 8,
	fontSize: 11,
	fontWeight: 500,
	left: 8,
	padding: "2px 5px",
	position: "absolute",
	textTransform: "uppercase",
};

// Featured image with the first term of `badgeTaxonomy` overlaid, like the original modal.
const PostThumbnail = ({ post, imageSize, badgeTaxonomy }) => {
	const badgeTermIds = (badgeTaxonomy && post[badgeTaxonomy]) || EMPTY_ARRAY;

	const { media, badgeTerm } = useSelect(
		(select) => {
			const { getMedia, getEntityRecords } = select(coreStore);
			return {
				media: post.featured_media
					? getMedia(post.featured_media, { context: "view" })
					: null,
				badgeTerm: badgeTermIds.length
					? getEntityRecords("taxonomy", badgeTaxonomy, {
							include: badgeTermIds,
							per_page: badgeTermIds.length,
							context: "view",
						})?.[0]
					: null,
			};
		},
		[post.featured_media, badgeTaxonomy, badgeTermIds.join(",")],
	);

	const src =
		media?.media_details?.sizes?.[imageSize]?.source_url || media?.source_url;

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			{src && <img src={src} alt="" />}
			{badgeTerm && <div style={BADGE_STYLE}>{decodeEntities(badgeTerm.name)}</div>}
		</div>
	);
};

/**
 * Prototype: same contract as PostSelectModal, but the grid/table, search,
 * pagination, and selection UI all come from DataViewsPicker.
 */
const PostSelectModalDataViews = ({ isOpen, ...props }) =>
	isOpen ? <Content {...props} /> : null;

const Content = ({
	queryArgs: { postType = "post", ...restQueryArgs } = {},
	onClose,
	onSelect,
	postCount = 1,
	selectedPostIds = EMPTY_ARRAY,
	title,
	insertLabel,
	badgeTaxonomy,
	imageSize = "full",
	views = ["pickerGrid", "pickerTable"],
}) => {
	// DataViews item IDs are strings.
	const [selection, setSelection] = useState(() =>
		selectedPostIds.slice(-postCount).map(String),
	);
	const [view, setView] = useState({
		type: views[0],
		search: restQueryArgs.search || "",
		page: 1,
		perPage: restQueryArgs.per_page || 20,
		titleField: "title",
		mediaField: "image",
		fields: ["date"],
		layout: { previewSize: 180 },
	});

	// Selection spans pages, so keep every record seen to hand back on insert.
	const knownPosts = useRef(new Map());

	const postTypeObject = useSelect(
		(select) => select(coreStore).getPostType(postType),
		[postType],
	);

	// The view *is* the query: page, perPage, and search map straight to REST args.
	const query = {
		context: "view",
		...restQueryArgs,
		page: view.page,
		per_page: view.perPage,
		...(view.search ? { search: view.search } : {}),
	};

	const { records, totalItems, totalPages, isResolving } = useEntityRecords(
		"postType",
		postType,
		query,
	);

	records?.forEach((post) => knownPosts.current.set(String(post.id), post));

	const fields = useMemo(() => {
		const { formats } = getSettings();
		return [
			{
				id: "image",
				label: __("Image", "rkv-editor-components"),
				type: "media",
				enableSorting: false,
				render: ({ item }) => (
					<PostThumbnail
						post={item}
						imageSize={imageSize}
						badgeTaxonomy={badgeTaxonomy}
					/>
				),
			},
			{
				id: "title",
				label: __("Title", "rkv-editor-components"),
				enableHiding: false,
				enableSorting: false,
				getValue: ({ item }) => decodeEntities(item.title.rendered),
			},
			{
				id: "date",
				label: __("Date", "rkv-editor-components"),
				enableSorting: false,
				getValue: ({ item }) => item.date,
				render: ({ item }) => dateI18n(formats.date, item.date),
			},
		];
	}, [imageSize, badgeTaxonomy]);

	const singular =
		postTypeObject?.labels?.singular_name || __("item", "rkv-editor-components");
	const plural =
		postTypeObject?.labels?.name || __("items", "rkv-editor-components");

	const onInsert = () =>
		onSelect(
			selection.map(Number),
			selection.map((id) => knownPosts.current.get(id)).filter(Boolean),
		);

	// The picker only allows multi-selection when it has bulk actions; the
	// insert button lives in the modal header, so this one is never rendered.
	const actions = useMemo(
		() =>
			postCount > 1
				? [{ id: "insert", label: "", supportsBulk: true, callback: () => {} }]
				: EMPTY_ARRAY,
		[postCount],
	);

	const defaultInsertLabel = selection.length
		? sprintf(
				/* translators: %s: post type label. */
				__("Insert %s", "rkv-editor-components"),
				selection.length > 1 ? plural : singular,
			)
		: sprintf(
				/* translators: %s: post type singular label. */
				__("Select %s", "rkv-editor-components"),
				singular,
			);

	return (
		<Modal
			size="fill"
			className="rkv-post-select-modal"
			title={
				title ||
				sprintf(
					/* translators: %s: post type singular label. */
					__("Select %s", "rkv-editor-components"),
					singular,
				)
			}
			headerActions={
				<Button
					variant="primary"
					onClick={onInsert}
					disabled={0 === selection.length}
				>
					{insertLabel || defaultInsertLabel}
				</Button>
			}
			onRequestClose={onClose}
		>
			<DataViewsPicker
				data={records || EMPTY_ARRAY}
				fields={fields}
				view={view}
				onChangeView={setView}
				actions={actions}
				selection={selection}
				onChangeSelection={(ids) => setSelection(ids.slice(-postCount))}
				getItemId={(post) => String(post.id)}
				isLoading={isResolving}
				paginationInfo={{ totalItems: totalItems ?? 0, totalPages: totalPages ?? 0 }}
				defaultLayouts={Object.fromEntries(views.map((type) => [type, {}]))}
				itemListLabel={__("Posts", "rkv-editor-components")}
			>
				<HStack
					alignment="top"
					justify="space-between"
					className="dataviews__view-actions"
				>
					<HStack justify="flex-start" className="dataviews__search">
						<DataViewsPicker.Search />
					</HStack>
					<HStack spacing={1} expanded={false}>
						<DataViewsPicker.LayoutSwitcher />
						<DataViewsPicker.ViewConfig />
					</HStack>
				</HStack>
				<DataViewsPicker.Layout />
				<DataViewsPicker.Footer>
					<DataViewsPicker.Pagination />
				</DataViewsPicker.Footer>
			</DataViewsPicker>
		</Modal>
	);
};

export default PostSelectModalDataViews;
