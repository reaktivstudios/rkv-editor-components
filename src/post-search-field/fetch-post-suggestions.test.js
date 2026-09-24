/**
 * Internal dependencies
 */
import fetchPostSuggestions from "./fetch-post-suggestions.js";

jest.mock("@wordpress/core-data", () => ({ store: "core" }), { virtual: true });

const POST_TYPES = {
	post: { slug: "post", labels: { singular_name: "Post" } },
	page: { slug: "page", labels: { singular_name: "Page" } },
	video: { slug: "video", labels: { singular_name: "Video" } },
};

const TAXONOMIES = [
	{ rest_base: "categories", types: ["post", "video"] },
	{ rest_base: "tags", types: ["post"] },
];

const RECORDS = {
	post: [
		{ id: 1, title: { rendered: "Banana" }, date_gmt: "2026-01-03", link: "/p1" },
		{ id: 2, title: { rendered: "apple &amp; pie" }, date_gmt: "2026-01-01", link: "/p2" },
	],
	video: [
		{ id: 10, title: { rendered: "Cherry" }, date_gmt: "2026-01-02", link: "/v10" },
		{ id: 11, title: { rendered: "Date" }, date_gmt: "2026-01-04", link: "/v11" },
	],
	page: [
		{ id: 20, title: { rendered: "Elder" }, date_gmt: "2026-01-05", link: "/pg20" },
	],
};

// A fake core-data registry that records each post-type query it receives.
const createRegistry = () => {
	const queries = [];

	return {
		queries,
		resolveSelect: () => ({
			getEntityRecord: async (kind, name, slug) => POST_TYPES[slug],
			getEntityRecords: async (kind, name, query) => {
				if ("root" === kind) {
					return TAXONOMIES;
				}

				queries.push({ postType: name, query });
				return RECORDS[name];
			},
		}),
	};
};

const ids = (suggestions) => suggestions.map((suggestion) => suggestion.id);

describe("fetchPostSuggestions", () => {
	it("defaults to the post post type", async () => {
		const registry = createRegistry();

		const results = await fetchPostSuggestions(registry, "", {});

		expect(ids(results)).toEqual([1, 2]);
		expect(registry.queries.map((q) => q.postType)).toEqual(["post"]);
	});

	it("passes queryArgs through to the REST query", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "", {
			postType: "post",
			categories: [3],
			author: 7,
		});

		expect(registry.queries[0].query).toMatchObject({
			categories: [3],
			author: 7,
			per_page: 10,
			context: "view",
		});
		expect(registry.queries[0].query).not.toHaveProperty("postType");
	});

	it("orders by relevance while searching", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "ban", { postType: "post" });

		expect(registry.queries[0].query).toMatchObject({
			search: "ban",
			orderby: "relevance",
		});
	});

	it("keeps an explicit orderby while searching", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "ban", {
			postType: "post",
			orderby: "title",
		});

		expect(registry.queries[0].query.orderby).toBe("title");
	});

	it("drops relevance ordering when nothing is typed", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "", {
			postType: "post",
			orderby: "relevance",
		});

		expect(registry.queries[0].query).not.toHaveProperty("orderby");
		expect(registry.queries[0].query).not.toHaveProperty("search");
	});

	it("ignores a search in queryArgs in favor of the typed term", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "", {
			postType: "post",
			search: "stale",
		});

		expect(registry.queries[0].query).not.toHaveProperty("search");
	});

	it("merges several post types by date, newest first, by default", async () => {
		const results = await fetchPostSuggestions(createRegistry(), "", {
			postType: ["post", "video"],
		});

		expect(ids(results)).toEqual([11, 1, 10, 2]);
	});

	it("merges several post types by title in the requested order", async () => {
		const results = await fetchPostSuggestions(createRegistry(), "", {
			postType: ["post", "video"],
			orderby: "title",
			order: "asc",
		});

		expect(ids(results)).toEqual([2, 1, 10, 11]);
	});

	it("interleaves post types for orderings it can't compare", async () => {
		const results = await fetchPostSuggestions(createRegistry(), "a", {
			postType: ["post", "video", "page"],
		});

		expect(ids(results)).toEqual([1, 10, 20, 2, 11]);
	});

	it("caps the merged results at per_page", async () => {
		const results = await fetchPostSuggestions(createRegistry(), "", {
			postType: ["post", "video", "page"],
			per_page: 3,
		});

		expect(ids(results)).toEqual([20, 11, 1]);
	});

	it("skips post types that don't use a filtered taxonomy", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "", {
			postType: ["post", "video", "page"],
			categories: [3],
		});

		expect(registry.queries.map((q) => q.postType)).toEqual(["post", "video"]);
	});

	it("requires every filtered taxonomy on a post type", async () => {
		const registry = createRegistry();

		await fetchPostSuggestions(registry, "", {
			postType: ["post", "video", "page"],
			categories: [3],
			tags: [12],
		});

		expect(registry.queries.map((q) => q.postType)).toEqual(["post"]);
	});

	it("skips post types that don't exist", async () => {
		const registry = createRegistry();

		const results = await fetchPostSuggestions(registry, "", {
			postType: ["missing", "post"],
		});

		expect(ids(results)).toEqual([1, 2]);
	});

	it("shapes results as LinkControl suggestions", async () => {
		const results = await fetchPostSuggestions(createRegistry(), "", {
			postType: ["post", "video"],
		});

		expect(results.find((s) => 2 === s.id)).toEqual({
			id: 2,
			title: "apple & pie",
			url: "/p2",
			type: "post",
			kind: "post-type",
			postType: "post",
		});

		// Custom post types show their singular label.
		expect(results.find((s) => 10 === s.id).type).toBe("Video");
	});
});
