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
import TermCollectionItem from "./term-collection-item.js";

const TermCollection = ({
	taxonomy,
	queryArgs,
	selectedTerms,
	onToggleTerm,
	view,
	showOrder,
	getImageUrl,
	renderItem,
}) => {
	// State to hold the accumulated terms.
	const [terms, setTerms] = useState([]);

	// State to hold the query_args page.
	const [page, setPage] = useState(1);

	// When the queryArgs change, reset the terms and page.
	useEffect(() => {
		setTerms([]);
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
				page,
			};

			return {
				records: getEntityRecords("taxonomy", taxonomy, paginatedQueryArgs),
				totalItems: getEntityRecordsTotalItems(
					"taxonomy",
					taxonomy,
					paginatedQueryArgs,
				),
				totalPages: getEntityRecordsTotalPages(
					"taxonomy",
					taxonomy,
					paginatedQueryArgs,
				),
			};
		},
		[taxonomy, queryArgs, page],
	);

	// Update the terms when records change.
	useEffect(() => {
		if (records && records.length > 0) {
			setTerms((prevTerms) => {
				const existingIds = new Set(prevTerms.map((term) => term.id));
				const newRecords = records.filter((term) => !existingIds.has(term.id));
				return [...prevTerms, ...newRecords];
			});
		}
	}, [records]);

	const handleLoadMore = () => {
		if (page < totalPages) {
			setPage((prevPage) => prevPage + 1);
		}
	};

	return (
		<div className={`term-collection term-collection--${view}`}>
			{terms.map((term) => {
				const orderIndex = selectedTerms.indexOf(term.id);

				return (
					<TermCollectionItem
						term={term}
						key={term.id}
						isSelected={-1 !== orderIndex}
						order={showOrder && -1 !== orderIndex ? orderIndex + 1 : null}
						onClick={() => onToggleTerm(term)}
						getImageUrl={getImageUrl}
						renderItem={renderItem}
						view={view}
					/>
				);
			})}
			{terms.length < totalItems && (
				<Button
					className="load-more-button"
					variant="primary"
					onClick={handleLoadMore}
				>
					{__("Load More", "rkv-editor-components")}
				</Button>
			)}
		</div>
	);
};

export default TermCollection;
