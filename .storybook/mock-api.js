/**
 * A fake WordPress REST API for Storybook.
 *
 * Registered as an apiFetch middleware, so core-data's real resolvers run
 * against fixture data: search, pagination, taxonomy filters, and ordering
 * behave as they would against WordPress.
 */

/**
 * WordPress dependencies
 */
import { getQueryArgs } from "@wordpress/url";

// Simulated network latency, so loading states are visible.
const LATENCY = 300;

const POST_TYPES = {
	post: {
		slug: "post",
		name: "Posts",
		rest_base: "posts",
		rest_namespace: "wp/v2",
		taxonomies: ["category", "post_tag"],
		labels: { name: "Posts", singular_name: "Post" },
	},
	page: {
		slug: "page",
		name: "Pages",
		rest_base: "pages",
		rest_namespace: "wp/v2",
		taxonomies: [],
		labels: { name: "Pages", singular_name: "Page" },
	},
	video: {
		slug: "video",
		name: "Videos",
		rest_base: "videos",
		rest_namespace: "wp/v2",
		taxonomies: ["category", "show"],
		labels: { name: "Videos", singular_name: "Video" },
	},
};

const TAXONOMIES = {
	category: {
		slug: "category",
		name: "Categories",
		rest_base: "categories",
		rest_namespace: "wp/v2",
		types: ["post", "video"],
	},
	post_tag: {
		slug: "post_tag",
		name: "Tags",
		rest_base: "tags",
		rest_namespace: "wp/v2",
		types: ["post"],
	},
	show: {
		slug: "show",
		name: "Shows",
		rest_base: "show",
		rest_namespace: "wp/v2",
		types: ["video"],
	},
};

const TERMS = {
	categories: [
		{ id: 1, name: "News", slug: "news" },
		{ id: 2, name: "Sports", slug: "sports" },
		{ id: 3, name: "Science", slug: "science" },
	],
	tags: [
		{ id: 11, name: "Featured", slug: "featured" },
		{ id: 12, name: "Analysis", slug: "analysis" },
	],
	show: [
		{ id: 21, name: "Morning Report", slug: "morning-report" },
		{ id: 22, name: "Evening Edition", slug: "evening-edition" },
		{ id: 23, name: "Weekend Review", slug: "weekend-review" },
	],
};

const TITLES = [
	"City council approves new transit plan",
	"Local team clinches playoff spot",
	"Researchers map a distant galaxy",
	"Five takeaways from the budget debate",
	"How the new stadium will change downtown",
	"A closer look at the drought",
	"Inside the race for governor",
	"Marathon draws record crowd",
	"New telescope sends back first images",
	"What the jobs report means for you",
	"Coach reflects on a winning season",
	"The science of better sleep",
	"Election night: what to watch",
	"Rookie breaks franchise scoring record",
	"Ocean temperatures hit new highs",
	"Small businesses adapt to rising costs",
	"Behind the scenes at the championship",
	"Why bees matter more than you think",
	"School board weighs later start times",
	"Underdogs & upsets: a tournament recap",
	"Robots are learning to cook",
	"Bridge repairs to close lanes for months",
	"The comeback nobody expected",
	"A guide to this weekend's meteor shower",
];

const PAGE_TITLES = ["About Us", "Contact", "Newsletter", "Privacy Policy", "Careers"];

const COLORS = ["#3858e9", "#008a20", "#cc1818", "#b26200", "#7e3bd0", "#007cba"];

// A 16:9 placeholder image, generated locally so stories need no network.
const placeholderImage = (label, color) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${color}"/><text x="320" y="190" font-family="sans-serif" font-size="36" fill="#fff" text-anchor="middle">${label}</text></svg>`,
	)}`;

const MEDIA = [];

const addMedia = (label, color) => {
	const id = 1000 + MEDIA.length;
	const source_url = placeholderImage(label, color);

	MEDIA.push({
		id,
		source_url,
		media_details: { sizes: { full: { source_url } } },
	});

	return id;
};

// Spread fixture dates over the last few weeks, newest first.
const dateFor = (index) => {
	const date = new Date(Date.UTC(2026, 8, 24, 14, 0, 0) - index * 26 * 3600 * 1000);
	return date.toISOString().slice(0, 19);
};

const createRecord = (id, type, title, index, extra = {}) => ({
	id,
	type,
	status: "publish",
	title: { rendered: title },
	link: `https://example.com/${type}/${id}/`,
	date: dateFor(index),
	date_gmt: dateFor(index),
	modified: dateFor(index),
	modified_gmt: dateFor(index),
	featured_media: 0,
	...extra,
});

const RECORDS = { posts: [], pages: [], videos: [] };

TITLES.forEach((title, index) => {
	// Every third item is a video. Count each type separately so shows,
	// categories, and colors cycle within it.
	const isVideo = 0 === index % 3;
	const typeIndex = isVideo ? RECORDS.videos.length : RECORDS.posts.length;
	const id = 100 + index;
	const category = TERMS.categories[typeIndex % TERMS.categories.length].id;
	const featured_media = addMedia(isVideo ? "Video" : "Post", COLORS[typeIndex % COLORS.length]);

	if (isVideo) {
		RECORDS.videos.push(
			createRecord(id, "video", title, index, {
				featured_media,
				categories: [category],
				show: [TERMS.show[typeIndex % TERMS.show.length].id],
			}),
		);
	} else {
		RECORDS.posts.push(
			createRecord(id, "post", title, index, {
				featured_media,
				categories: [category],
				tags: 0 === typeIndex % 4 ? [11] : [12],
			}),
		);
	}
});

PAGE_TITLES.forEach((title, index) => {
	RECORDS.pages.push(createRecord(200 + index, "page", title, index * 5));
});

const toArray = (value) =>
	undefined === value || "" === value
		? []
		: [].concat(value).flatMap((item) => String(item).split(",")).map(Number);

const titleOf = (record) => record.title?.rendered ?? record.name ?? "";

const matchesTaxonomies = (record, args) => {
	const filters = Object.values(TAXONOMIES)
		.filter((taxonomy) => taxonomy.types.includes(record.type))
		.filter((taxonomy) => undefined !== args[taxonomy.rest_base]);

	const matches = filters.map((taxonomy) => {
		const wanted = toArray(args[taxonomy.rest_base]);
		return (record[taxonomy.rest_base] || []).some((id) => wanted.includes(id));
	});

	const excluded = Object.values(TAXONOMIES).some((taxonomy) => {
		const unwanted = toArray(args[`${taxonomy.rest_base}_exclude`]);
		return (record[taxonomy.rest_base] || []).some((id) => unwanted.includes(id));
	});

	if (excluded) {
		return false;
	}

	return "OR" === String(args.tax_relation).toUpperCase()
		? 0 === matches.length || matches.some(Boolean)
		: matches.every(Boolean);
};

const relevance = (record, search) => {
	const title = titleOf(record).toLowerCase();
	return title.startsWith(search) ? 2 : 1;
};

const sortRecords = (records, args) => {
	const { orderby = "date", order = "desc" } = args;
	const direction = "asc" === order ? 1 : -1;
	const include = toArray(args.include);

	const sorters = {
		date: (a, b) => a.date_gmt.localeCompare(b.date_gmt) * direction,
		modified: (a, b) => a.modified_gmt.localeCompare(b.modified_gmt) * direction,
		title: (a, b) => titleOf(a).localeCompare(titleOf(b)) * direction,
		id: (a, b) => (a.id - b.id) * direction,
		include: (a, b) => include.indexOf(a.id) - include.indexOf(b.id),
		relevance: (a, b) =>
			relevance(b, String(args.search || "").toLowerCase()) - relevance(a, String(args.search || "").toLowerCase()) ||
			b.date_gmt.localeCompare(a.date_gmt),
	};

	return [...records].sort(sorters[orderby] || sorters.date);
};

const pickFields = (record, fields) => {
	if (!fields) {
		return record;
	}

	const keys = String(fields).split(",");
	return Object.fromEntries(Object.entries(record).filter(([key]) => keys.includes(key)));
};

const queryCollection = (records, args) => {
	const search = String(args.search || "").toLowerCase();
	const include = toArray(args.include);
	const exclude = toArray(args.exclude);

	const matching = records.filter(
		(record) =>
			(!include.length || include.includes(record.id)) &&
			!exclude.includes(record.id) &&
			(!search || titleOf(record).toLowerCase().includes(search)) &&
			matchesTaxonomies(record, args),
	);

	const sorted = sortRecords(matching, args);
	const perPage = -1 === Number(args.per_page) ? sorted.length || 1 : Number(args.per_page) || 10;
	const page = Number(args.page) || 1;

	return {
		body: sorted.slice((page - 1) * perPage, page * perPage).map((record) => pickFields(record, args._fields)),
		total: sorted.length,
		totalPages: Math.max(1, Math.ceil(sorted.length / perPage)),
	};
};

const route = (pathname, args) => {
	const [, namespace, version, resource, id] = pathname.split("/");

	if ("wp" !== namespace || "v2" !== version) {
		return null;
	}

	if ("types" === resource) {
		return { body: id ? POST_TYPES[id] : POST_TYPES };
	}

	if ("taxonomies" === resource) {
		return { body: id ? TAXONOMIES[id] : TAXONOMIES };
	}

	if ("media" === resource) {
		return id
			? { body: MEDIA.find((media) => media.id === Number(id)) }
			: queryCollection(MEDIA, args);
	}

	const collection = RECORDS[resource] || TERMS[resource];

	if (!collection) {
		return null;
	}

	return id
		? { body: collection.find((record) => record.id === Number(id)) }
		: queryCollection(collection, args);
};

const mockApiMiddleware = (options) => {
	const path = options.path || options.url || "";
	const [pathname] = path.split("?");
	const result = route(pathname, getQueryArgs(path));

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (!result?.body) {
				// eslint-disable-next-line no-console
				console.warn(`[mock-api] No fixture for ${options.method || "GET"} ${path}`);
				reject({ code: "rest_no_route", message: `No fixture for ${path}`, data: { status: 404 } });
				return;
			}

			if (false === options.parse) {
				resolve(
					new Response(JSON.stringify(result.body), {
						headers: {
							"Content-Type": "application/json",
							"X-WP-Total": String(result.total ?? 0),
							"X-WP-TotalPages": String(result.totalPages ?? 1),
						},
					}),
				);
				return;
			}

			resolve(result.body);
		}, LATENCY);
	});
};

export default mockApiMiddleware;
