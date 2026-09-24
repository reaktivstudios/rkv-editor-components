/**
 * WordPress dependencies
 */
import { useEffect, useState } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

/**
 * Internal dependencies
 */
import PostCollectionItem from "./post-collection-item.js";

const PostCollection = ({
	postType,
	queryArgs,
	selectedPosts,
	onSelectPost,
	view,
	badgeTaxonomy,
	imageSize,
	renderItem,
}) => {
	// State to hold the accumulated posts.
	const [posts, setPosts] = useState([]);

	// State to hold the query_args page.
	const [page, setPage] = useState(1);

	// When the queryArgs change, reset the posts and page.
	useEffect(() => {
		setPosts([]);
		setPage(1);
	}, [queryArgs]);

	const { records, totalItems, totalPages } = useSelect(
		(select) => {
			const {
				getEntityRecords,
				getEntityRecordsTotalItems,
				getEntityRecordsTotalPages,
			} = select("core");

			const paginatedQueryArgs = {
				...queryArgs,
				page: page,
			};

			return {
				records: getEntityRecords("postType", postType, paginatedQueryArgs),
				totalItems: getEntityRecordsTotalItems(
					"postType",
					postType,
					paginatedQueryArgs,
				),
				totalPages: getEntityRecordsTotalPages(
					"postType",
					postType,
					paginatedQueryArgs,
				),
			};
		},
		[postType, queryArgs, page],
	);

	// useEffect to update the posts when records change.
	useEffect(() => {
		if (records && records.length > 0) {
			setPosts((prevPosts) => {
				const existingIds = new Set(prevPosts.map((post) => post.id));
				const newRecords = records.filter((post) => !existingIds.has(post.id));
				return [...prevPosts, ...newRecords];
			});
		}
	}, [records]);

	const handleLoadMore = () => {
		if (page < totalPages) {
			setPage((prevPage) => prevPage + 1);
		}
	};

	const handleSelect = (post) => {
		onSelectPost(post);
	};

	return (
		<div className={`post-collection post-collection--${view}`}>
			{posts?.map((post) => (
				<PostCollectionItem
					post={post}
					key={post.id}
					isSelected={selectedPosts.includes(post.id)}
					onClick={() => handleSelect(post)}
					badgeTaxonomy={badgeTaxonomy}
					imageSize={imageSize}
					renderItem={renderItem}
					view={view}
				/>
			))}
			{posts.length < totalItems && (
				<Button
					className="load-more-button"
					variant="primary"
					onClick={() => handleLoadMore()}
				>
					{__("Load More", "rkv-editor-components")}
				</Button>
			)}
		</div>
	);
};

export default PostCollection;
