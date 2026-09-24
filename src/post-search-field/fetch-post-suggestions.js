/**
 * WordPress dependencies
 */
import { store as coreStore } from "@wordpress/core-data";
import { decodeEntities } from "@wordpress/html-entities";

const FIELDS = "id,title,link,date_gmt,modified_gmt";

// Post types LinkControl already has an icon and label for.
const BUILT_IN_TYPES = ["post", "page", "attachment"];

// Record values used to sort results merged from several post types.
const SORT_VALUES = {
	date: (record) => record.date_gmt,
	modified: (record) => record.modified_gmt,
	title: (record) => decodeEntities(record.title?.rendered || ""),
	id: (record) => record.id,
};

/**
 * Normalizes the query sent to each post type's REST collection.
 *
 * @param {string} search    Search term typed into the field.
 * @param {Object} queryArgs REST collection args, minus `postType`.
 * @return {Object} Query args.
 */
const buildQuery = (search, queryArgs) => {
	const query = {
		...queryArgs,
		per_page: queryArgs.per_page ?? 10,
		context: "view",
		_fields: FIELDS,
	};

	delete query.search;

	if (search) {
		query.search = search;
		query.orderby = queryArgs.orderby ?? "relevance";
	} else if ("relevance" === query.orderby) {
		// The REST API rejects relevance ordering without a search term.
		delete query.orderby;
	}

	return query;
};

/**
 * Merges per-post-type results into one list, honoring `orderby` and `order`.
 *
 * Orderings with no comparable value (e.g. relevance, include) are interleaved
 * so each post type's best matches stay near the top.
 *
 * @param {Array[]} groups Result groups of `{ record, suggestion }`.
 * @param {Object}  query  The query that produced them.
 * @return {Object[]} Suggestions.
 */
const mergeResults = (groups, { orderby = "date", order = "desc", per_page }) => {
	let merged;

	if (1 === groups.length) {
		merged = groups[0];
	} else if (SORT_VALUES[orderby]) {
		const getValue = SORT_VALUES[orderby];
		const direction = "asc" === order ? 1 : -1;

		merged = groups.flat().sort((a, b) => {
			const valueA = getValue(a.record);
			const valueB = getValue(b.record);

			const comparison =
				"string" === typeof valueA
					? valueA.localeCompare(valueB)
					: valueA - valueB;

			return comparison * direction;
		});
	} else {
		merged = [];
		const longest = Math.max(...groups.map((group) => group.length));

		for (let i = 0; i < longest; i++) {
			groups.forEach((group) => group[i] && merged.push(group[i]));
		}
	}

	return merged.slice(0, per_page).map(({ suggestion }) => suggestion);
};

/**
 * Fetches post suggestions for LinkControlSearchInput.
 *
 * @param {Object} registry  Data registry.
 * @param {string} search    Search term typed into the field.
 * @param {Object} queryArgs `postType` (a slug or array of slugs) plus REST collection args.
 * @return {Promise<Object[]>} Suggestions shaped for LinkControl.
 */
const fetchPostSuggestions = async (registry, search, queryArgs = {}) => {
	const { postType = "post", ...restQueryArgs } = queryArgs;
	const { getEntityRecord, getEntityRecords } = registry.resolveSelect(coreStore);

	const query = buildQuery(search, restQueryArgs);

	const [postTypeObjects, taxonomies] = await Promise.all([
		Promise.all(
			[].concat(postType).map((slug) => getEntityRecord("root", "postType", slug)),
		),
		getEntityRecords("root", "taxonomy", { per_page: -1 }),
	]);

	// Taxonomy filters in the query, keyed by REST base (e.g. `categories`).
	const taxonomyFilters = (taxonomies || []).filter(
		(taxonomy) => taxonomy.rest_base in restQueryArgs,
	);

	// A post type without a filtered taxonomy would ignore the filter and
	// return unfiltered posts, so leave it out.
	const searchableTypes = postTypeObjects.filter(
		(type) =>
			type &&
			taxonomyFilters.every((taxonomy) => taxonomy.types.includes(type.slug)),
	);

	const groups = await Promise.all(
		searchableTypes.map(async (type) => {
			const records =
				(await getEntityRecords("postType", type.slug, query)) || [];

			return records.map((record) => ({
				record,
				suggestion: {
					id: record.id,
					title: decodeEntities(record.title?.rendered || ""),
					url: record.link,
					// LinkControl shows `type` as the result's label.
					type: BUILT_IN_TYPES.includes(type.slug)
						? type.slug
						: type.labels?.singular_name || type.slug,
					kind: "post-type",
					postType: type.slug,
				},
			}));
		}),
	);

	return mergeResults(groups, query);
};

export default fetchPostSuggestions;
