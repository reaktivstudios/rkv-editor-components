/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import PostModal from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const {
			Children,
			cloneElement,
			createElement: el,
		} = require("@wordpress/element");

		return {
			Modal: ({ title, headerActions, children, className }) =>
				el(
					"div",
					{ role: "dialog", "aria-label": title, className },
					el("h1", null, title),
					headerActions,
					children,
				),
			Button: ({ children, onClick, disabled, className }) =>
				el("button", { onClick, disabled, className }, children),
			SearchControl: ({ value, onChange, placeholder }) =>
				el("input", {
					type: "search",
					value,
					placeholder,
					onChange: (event) => onChange(event.target.value),
				}),
			__experimentalHStack: ({ children }) => el("div", null, children),
			__experimentalToggleGroupControl: ({ children, value, onChange }) =>
				el(
					"div",
					{ "data-testid": "view-toggle", "data-value": value },
					Children.map(children, (child) =>
						cloneElement(child, {
							onPick: () => onChange(child.props.value),
						}),
					),
				),
			__experimentalToggleGroupControlOptionIcon: ({ label, onPick }) =>
				el("button", { onClick: onPick }, label),
		};
	},
	{ virtual: true },
);

jest.mock("@wordpress/icons", () => ({ grid: "grid", listView: "listView" }), {
	virtual: true,
});

jest.mock("@wordpress/compose", () => ({ useDebounce: (fn) => fn }), {
	virtual: true,
});

jest.mock("@wordpress/core-data", () => ({ store: "core" }), { virtual: true });

// A fake core-data store. Results are cached per query so references stay
// stable across renders, as they do in the real store.
let mockPosts = [];
let mockTerms = [];
let mockQueries = [];
let mockCache = new Map();

jest.mock(
	"@wordpress/data",
	() => {
		const cached = (key, compute) => {
			if (!mockCache.has(key)) {
				mockCache.set(key, compute());
			}
			return mockCache.get(key);
		};

		const matching = (name, query) =>
			mockPosts.filter(
				(post) =>
					(!query.include || query.include.includes(post.id)) &&
					(!query.search || post.title.rendered.includes(query.search)),
			);

		const selectors = {
			getPostType: (slug) =>
				cached(`type:${slug}`, () => ({
					labels: { singular_name: "Video", name: "Videos" },
				})),
			getEntityRecords: (kind, name, query) => {
				if ("taxonomy" === kind) {
					return cached(`terms:${name}:${query.include}`, () =>
						mockTerms.filter((term) => query.include.includes(term.id)),
					);
				}

				return cached(`${name}:${JSON.stringify(query)}`, () => {
					mockQueries.push({ name, query });
					return matching(name, query);
				});
			},
			getEntityRecordsTotalItems: (kind, name, query) =>
				matching(name, query).length,
			getEntityRecordsTotalPages: () => 1,
			getMedia: () => undefined,
		};

		return { useSelect: (mapper) => mapper(() => selectors) };
	},
	{ virtual: true },
);

const post = (id, title, extra = {}) => ({
	id,
	title: { rendered: title },
	date: "2026-01-01T10:00:00",
	...extra,
});

const renderModal = (props = {}) => {
	const onSelect = jest.fn();
	const onClose = jest.fn();

	const utils = render(
		<PostModal isOpen onSelect={onSelect} onClose={onClose} {...props} />,
	);

	return { ...utils, onSelect, onClose };
};

const item = (title) => screen.getByText(title).closest(".post-selection-item");

const insertButton = () =>
	screen.getByRole("button", { name: /^(Insert|Select) / });

beforeEach(() => {
	mockPosts = [post(1, "Alpha"), post(2, "Bravo"), post(3, "Charlie")];
	mockTerms = [];
	mockQueries = [];
	mockCache = new Map();
});

describe("PostModal", () => {
	it("renders nothing when closed", () => {
		const { container } = render(<PostModal isOpen={false} onSelect={jest.fn()} />);

		expect(container.innerHTML).toBe("");
	});

	it("lists posts and labels itself from the post type", () => {
		renderModal();

		expect(screen.getByRole("dialog", { name: "Select Video" })).toBeTruthy();
		expect(screen.getByText("Alpha")).toBeTruthy();
		expect(screen.getByText("Charlie")).toBeTruthy();
		expect(insertButton().textContent).toBe("Select Video");
		expect(insertButton().disabled).toBe(true);
	});

	it("queries the post type from queryArgs with the other args merged over the defaults", () => {
		renderModal({ queryArgs: { postType: "video", categories: [3] } });

		expect(mockQueries[0]).toEqual({
			name: "video",
			query: { per_page: 20, context: "view", categories: [3], page: 1 },
		});
	});

	it("adds the typed search to the query", () => {
		renderModal();

		fireEvent.change(screen.getByPlaceholderText("Search..."), {
			target: { value: "Bra" },
		});

		expect(mockQueries.at(-1).query.search).toBe("Bra");
		expect(screen.queryByText("Alpha")).toBeNull();
		expect(screen.getByText("Bravo")).toBeTruthy();
	});

	it("inserts the selected post's ID and record", () => {
		const { onSelect } = renderModal();

		fireEvent.click(item("Bravo"));

		expect(item("Bravo").getAttribute("aria-selected")).toBe("true");
		expect(insertButton().textContent).toBe("Insert Video");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2], [mockPosts[1]]);
	});

	it("deselects a post when it's clicked again", () => {
		renderModal();

		fireEvent.click(item("Bravo"));
		fireEvent.click(item("Bravo"));

		expect(item("Bravo").getAttribute("aria-selected")).toBe("false");
		expect(insertButton().disabled).toBe(true);
	});

	it("drops the oldest selection past postCount", () => {
		const { onSelect } = renderModal({ postCount: 2 });

		fireEvent.click(item("Alpha"));
		fireEvent.click(item("Bravo"));
		fireEvent.click(item("Charlie"));

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
		expect(insertButton().textContent).toBe("Insert Videos");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2, 3], [mockPosts[1], mockPosts[2]]);
	});

	it("selects posts with the keyboard", () => {
		renderModal();

		fireEvent.keyDown(item("Alpha"), { keyCode: 13 }); // Enter.
		expect(item("Alpha").getAttribute("aria-selected")).toBe("true");

		fireEvent.keyDown(item("Bravo"), { keyCode: 32 }); // Space.
		expect(item("Bravo").getAttribute("aria-selected")).toBe("true");

		fireEvent.keyDown(item("Charlie"), { keyCode: 65 }); // "a".
		expect(item("Charlie").getAttribute("aria-selected")).toBe("false");
	});

	it("preselects selectedPostIds, keeping the most recent postCount", () => {
		const { onSelect } = renderModal({
			selectedPostIds: [1, 3],
			postCount: 1,
		});

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
		expect(item("Charlie").getAttribute("aria-selected")).toBe("true");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([3], [mockPosts[2]]);
	});

	it("returns records for preselected posts outside the loaded list", () => {
		const { onSelect } = renderModal({
			selectedPostIds: [2],
			queryArgs: { search: "Alpha" },
		});

		expect(screen.queryByText("Bravo")).toBeNull();

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2], [mockPosts[1]]);
	});

	it("resets the selection each time it opens", () => {
		const onSelect = jest.fn();
		const { rerender } = render(<PostModal isOpen onSelect={onSelect} />);

		fireEvent.click(item("Alpha"));
		rerender(<PostModal isOpen={false} onSelect={onSelect} />);
		rerender(<PostModal isOpen onSelect={onSelect} />);

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
	});

	it("uses a custom title and insert label", () => {
		renderModal({ title: "Pick a clip", insertLabel: "Use clip" });

		expect(screen.getByRole("dialog", { name: "Pick a clip" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Use clip" })).toBeTruthy();
	});

	it("switches between grid and list views", () => {
		const { container } = renderModal();

		expect(container.querySelector(".post-collection--grid")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "List View" }));

		expect(container.querySelector(".post-collection--list")).toBeTruthy();
	});

	it("starts in defaultView", () => {
		const { container } = renderModal({ defaultView: "list" });

		expect(container.querySelector(".post-collection--list")).toBeTruthy();
	});

	it("hides the view toggle when only one view is available", () => {
		const { container } = renderModal({ views: ["list"] });

		expect(screen.queryByTestId("view-toggle")).toBeNull();
		expect(container.querySelector(".post-collection--list")).toBeTruthy();
	});

	it("renders items with renderItem while keeping selection behavior", () => {
		renderModal({
			renderItem: ({ post: { title }, isSelected, view }) => (
				<span>{`${title.rendered} (${view}${isSelected ? ", selected" : ""})`}</span>
			),
		});

		fireEvent.click(item("Alpha (grid)"));

		expect(screen.getByText("Alpha (grid, selected)")).toBeTruthy();
	});

	it("badges each post with the first term of badgeTaxonomy", () => {
		mockPosts = [post(1, "Alpha", { show: [5] })];
		mockTerms = [{ id: 5, name: "Morning &amp; Night" }];

		const { container } = renderModal({ badgeTaxonomy: "show" });

		expect(container.querySelector(".post-badge").textContent).toBe(
			"Morning & Night",
		);
	});

	it("shows no badge without badgeTaxonomy", () => {
		mockPosts = [post(1, "Alpha", { show: [5] })];
		mockTerms = [{ id: 5, name: "Morning" }];

		const { container } = renderModal();

		expect(container.querySelector(".post-badge")).toBeNull();
	});
});
