/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import TermSelectModal from "./index.js";

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

		const matching = (query) =>
			mockTerms.filter(
				(term) =>
					(!query.include || query.include.includes(term.id)) &&
					(!query.search || term.name.includes(query.search)),
			);

		const selectors = {
			getTaxonomy: (slug) =>
				cached(`taxonomy:${slug}`, () => ({
					labels: { singular_name: "Show", name: "Shows" },
				})),
			getEntityRecords: (kind, name, query) =>
				cached(`${name}:${JSON.stringify(query)}`, () => {
					mockQueries.push({ name, query });
					return matching(query);
				}),
			getEntityRecordsTotalItems: (kind, name, query) =>
				matching(query).length,
			getEntityRecordsTotalPages: () => 1,
		};

		return { useSelect: (mapper) => mapper(() => selectors) };
	},
	{ virtual: true },
);

const term = (id, name, extra = {}) => ({ id, name, count: 0, ...extra });

const renderModal = (props = {}) => {
	const onSelect = jest.fn();
	const onClose = jest.fn();

	const utils = render(
		<TermSelectModal
			isOpen
			taxonomy="show"
			onSelect={onSelect}
			onClose={onClose}
			{...props}
		/>,
	);

	return { ...utils, onSelect, onClose };
};

const item = (name) => screen.getByText(name).closest(".term-selection-item");

const insertButton = () =>
	screen.getByRole("button", { name: /^(Insert|Select) / });

beforeEach(() => {
	mockTerms = [term(1, "Alpha"), term(2, "Bravo"), term(3, "Charlie")];
	mockQueries = [];
	mockCache = new Map();
});

describe("TermSelectModal", () => {
	it("renders nothing when closed", () => {
		const { container } = render(
			<TermSelectModal isOpen={false} onSelect={jest.fn()} />,
		);

		expect(container.innerHTML).toBe("");
	});

	it("lists terms and labels itself from the taxonomy", () => {
		renderModal();

		expect(screen.getByRole("dialog", { name: "Select Show" })).toBeTruthy();
		expect(screen.getByText("Alpha")).toBeTruthy();
		expect(screen.getByText("Charlie")).toBeTruthy();
		expect(insertButton().textContent).toBe("Select Show");
		expect(insertButton().disabled).toBe(true);
	});

	it("queries the taxonomy with queryArgs merged over the defaults", () => {
		renderModal({ queryArgs: { parent: 0, per_page: 10 } });

		expect(mockQueries[0]).toEqual({
			name: "show",
			query: {
				per_page: 10,
				context: "view",
				orderby: "name",
				order: "asc",
				hide_empty: false,
				parent: 0,
				page: 1,
			},
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

	it("inserts the selected term's ID and record", () => {
		const { onSelect } = renderModal();

		fireEvent.click(item("Bravo"));

		expect(item("Bravo").getAttribute("aria-selected")).toBe("true");
		expect(insertButton().textContent).toBe("Insert Show");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2], [mockTerms[1]]);
	});

	it("deselects a term when it's clicked again", () => {
		renderModal();

		fireEvent.click(item("Bravo"));
		fireEvent.click(item("Bravo"));

		expect(item("Bravo").getAttribute("aria-selected")).toBe("false");
		expect(insertButton().disabled).toBe(true);
	});

	it("drops the oldest selection past termCount", () => {
		const { onSelect } = renderModal({ termCount: 2 });

		fireEvent.click(item("Alpha"));
		fireEvent.click(item("Bravo"));
		fireEvent.click(item("Charlie"));

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
		expect(insertButton().textContent).toBe("Insert Shows");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2, 3], [mockTerms[1], mockTerms[2]]);
	});

	it("badges selected terms with their order when several can be selected", () => {
		const { container } = renderModal({ termCount: 3 });

		fireEvent.click(item("Charlie"));
		fireEvent.click(item("Alpha"));

		const badges = [...container.querySelectorAll(".term-order-badge")];

		expect(badges.map((badge) => badge.textContent)).toEqual(["2", "1"]);
	});

	it("shows no order badge when only one term can be selected", () => {
		const { container } = renderModal();

		fireEvent.click(item("Alpha"));

		expect(container.querySelector(".term-order-badge")).toBeNull();
	});

	it("selects terms with the keyboard", () => {
		renderModal();

		fireEvent.keyDown(item("Alpha"), { keyCode: 13 }); // Enter.
		expect(item("Alpha").getAttribute("aria-selected")).toBe("true");

		fireEvent.keyDown(item("Bravo"), { keyCode: 32 }); // Space.
		expect(item("Bravo").getAttribute("aria-selected")).toBe("true");

		fireEvent.keyDown(item("Charlie"), { keyCode: 65 }); // "a".
		expect(item("Charlie").getAttribute("aria-selected")).toBe("false");
	});

	it("preselects selectedTermIds, keeping the most recent termCount", () => {
		const { onSelect } = renderModal({
			selectedTermIds: [1, 3],
			termCount: 1,
		});

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
		expect(item("Charlie").getAttribute("aria-selected")).toBe("true");

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([3], [mockTerms[2]]);
	});

	it("returns records for preselected terms outside the loaded list", () => {
		const { onSelect } = renderModal({
			selectedTermIds: [2],
			queryArgs: { search: "Alpha" },
		});

		expect(screen.queryByText("Bravo")).toBeNull();

		fireEvent.click(insertButton());

		expect(onSelect).toHaveBeenCalledWith([2], [mockTerms[1]]);
	});

	it("resets the selection each time it opens", () => {
		const onSelect = jest.fn();
		const { rerender } = render(
			<TermSelectModal isOpen taxonomy="show" onSelect={onSelect} />,
		);

		fireEvent.click(item("Alpha"));
		rerender(
			<TermSelectModal isOpen={false} taxonomy="show" onSelect={onSelect} />,
		);
		rerender(<TermSelectModal isOpen taxonomy="show" onSelect={onSelect} />);

		expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
	});

	it("uses a custom title and insert label", () => {
		renderModal({ title: "Pick a show", insertLabel: "Use show" });

		expect(screen.getByRole("dialog", { name: "Pick a show" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Use show" })).toBeTruthy();
	});

	it("switches between grid and list views", () => {
		const { container } = renderModal();

		expect(container.querySelector(".term-collection--grid")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "List View" }));

		expect(container.querySelector(".term-collection--list")).toBeTruthy();
	});

	it("starts in defaultView", () => {
		const { container } = renderModal({ defaultView: "list" });

		expect(container.querySelector(".term-collection--list")).toBeTruthy();
	});

	it("hides the view toggle when only one view is available", () => {
		const { container } = renderModal({ views: ["list"] });

		expect(screen.queryByTestId("view-toggle")).toBeNull();
		expect(container.querySelector(".term-collection--list")).toBeTruthy();
	});

	it("decodes term names and shows item counts", () => {
		mockTerms = [term(1, "Morning &amp; Night", { count: 1 }), term(2, "Bravo", { count: 4 })];

		renderModal();

		expect(screen.getByText("Morning & Night")).toBeTruthy();
		expect(screen.getByText("1 item")).toBeTruthy();
		expect(screen.getByText("4 items")).toBeTruthy();
	});

	it("shows thumbnails from getImageUrl and initials otherwise", () => {
		const { container } = renderModal({
			getImageUrl: (t) => (1 === t.id ? "alpha.jpg" : ""),
		});

		expect(container.querySelector("img").getAttribute("src")).toBe("alpha.jpg");
		expect(container.querySelectorAll(".term-thumbnail-placeholder")).toHaveLength(2);
		expect(screen.getByText("BR")).toBeTruthy();
	});

	it("renders items with renderItem while keeping selection behavior", () => {
		renderModal({
			renderItem: ({ term: { name }, isSelected, view }) => (
				<span>{`${name} (${view}${isSelected ? ", selected" : ""})`}</span>
			),
		});

		fireEvent.click(item("Alpha (grid)"));

		expect(screen.getByText("Alpha (grid, selected)")).toBeTruthy();
	});
});
