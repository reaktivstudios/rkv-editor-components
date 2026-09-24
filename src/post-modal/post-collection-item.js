/**
 * WordPress dependencies
 */
import { decodeEntities } from "@wordpress/html-entities";
import { useSelect } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data";
import { dateI18n, getSettings } from "@wordpress/date";
import { ENTER, SPACE } from "@wordpress/keycodes";

/**
 * External dependencies
 */
import classnames from "classnames";

const DefaultItemContent = ({ post, badgeTaxonomy, imageSize }) => {
	const { media } = useSelect(
		(select) => {
			const { getMedia } = select(coreStore);

			if (!post?.featured_media) {
				return "";
			}

			return {
				media:
					post?.featured_media &&
					getMedia(post?.featured_media, {
						context: "view",
					}),
			};
		},
		[post?.featured_media],
	);

	const featured_media_url =
		media?.media_details?.sizes?.[imageSize]?.source_url || media?.source_url;

	// Term IDs from the post REST response, keyed by the taxonomy rest_base.
	const badgeTermIds = (badgeTaxonomy && post?.[badgeTaxonomy]) || [];

	const { badgeTerm } = useSelect(
		(select) => {
			if (!badgeTermIds.length) {
				return { badgeTerm: null };
			}

			const { getEntityRecords } = select(coreStore);

			const terms = getEntityRecords("taxonomy", badgeTaxonomy, {
				include: badgeTermIds,
				per_page: badgeTermIds.length,
				context: "view",
			});

			return {
				badgeTerm: terms?.[0] || null,
			};
		},
		[badgeTaxonomy, badgeTermIds.join(",")],
	);

	const { formats } = getSettings();

	const publishLabel = post?.date
		? dateI18n(`${formats.date} · ${formats.time}`, post.date)
		: null;

	return (
		<>
			<div className="post-thumbnail">
				{featured_media_url && (
					<img
						src={featured_media_url}
						alt={decodeEntities(post.title.rendered)}
						className={"post-thumbnail-image"}
					/>
				)}
				{badgeTerm && (
					<div className="post-badge">{decodeEntities(badgeTerm.name)}</div>
				)}
			</div>
			<div className="post-title">{decodeEntities(post.title.rendered)}</div>
			{publishLabel && <div className="post-date">{publishLabel}</div>}
		</>
	);
};

const PostCollectionItem = ({
	post,
	isSelected,
	onClick,
	badgeTaxonomy,
	imageSize,
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
			id={`post-${post.id}`}
			aria-selected={isSelected}
			tabIndex={0}
			role="button"
			onClick={() => onClick()}
			onKeyDown={onKeyDown}
			className={classnames("post-selection-item", {
				"is-selected": isSelected,
			})}
		>
			{renderItem ? (
				renderItem({ post, isSelected, view })
			) : (
				<DefaultItemContent
					post={post}
					badgeTaxonomy={badgeTaxonomy}
					imageSize={imageSize}
				/>
			)}
		</div>
	);
};

export default PostCollectionItem;
