/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import PatternPicker, { usePatternsForBlock } from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el, useState } = require("@wordpress/element");

		return {
			ToolbarButton: ({ children, onClick }) =>
				el("button", { onClick }, children),
			__experimentalDropdownContentWrapper: ({ children }) => el("div", null, children),
			Dropdown: ({ renderToggle, renderContent }) => {
				const [isOpen, setIsOpen] = useState(false);
				return el(
					"div",
					null,
					renderToggle({ isOpen, onToggle: () => setIsOpen(!isOpen) }),
					isOpen && renderContent({ onClose: () => setIsOpen(false) }),
				);
			},
		};
	},
	{ virtual: true },
);

jest.mock(
	"@wordpress/block-editor",
	() => {
		const { createElement: el } = require("@wordpress/element");

		return {
			store: "core/block-editor",
			BlockControls: ({ children }) => el("div", { "data-testid": "controls" }, children),
			__experimentalBlockPatternsList: ({ blockPatterns, onClickPattern }) =>
				blockPatterns.map((pattern) =>
					el(
						"button",
						{ key: pattern.name, onClick: () => onClickPattern(pattern, pattern.blocks) },
						pattern.title,
					),
				),
		};
	},
	{ virtual: true },
);

let mockPatterns;
let mockBlockCount;
let mockPatternQueries;
const mockReplaceInnerBlocks = jest.fn();

jest.mock(
	"@wordpress/data",
	() => ({
		useSelect: (mapper) =>
			mapper(() => ({
				getBlockName: (clientId) => ("missing" === clientId ? null : "my/block"),
				getPatternsByBlockTypes: (...args) => {
					mockPatternQueries.push(args);
					return mockPatterns;
				},
				getBlockCount: () => mockBlockCount,
			})),
		useDispatch: () => ({ replaceInnerBlocks: mockReplaceInnerBlocks }),
	}),
	{ virtual: true },
);

const pattern = (name, title) => ({ name, title, blocks: [{ name: `block-${name}` }] });

beforeEach(() => {
	mockPatterns = [pattern("one", "Pattern One"), pattern("two", "Pattern Two")];
	mockBlockCount = 0;
	mockPatternQueries = [];
	mockReplaceInnerBlocks.mockClear();
});

describe("PatternPicker", () => {
	it("renders nothing when no patterns target the block", () => {
		mockPatterns = [];

		const { container } = render(<PatternPicker clientId="abc" />);

		expect(container.innerHTML).toBe("");
	});

	it("asks for patterns of the block's type that fit inside it", () => {
		render(<PatternPicker clientId="abc" />);

		expect(mockPatternQueries[0]).toEqual(["my/block", "abc"]);
	});

	it("labels the toggle by whether the block has inner blocks", () => {
		const { rerender } = render(<PatternPicker clientId="abc" />);

		expect(screen.getByRole("button", { name: "Choose pattern" })).toBeTruthy();

		mockBlockCount = 2;
		rerender(<PatternPicker clientId="abc" />);

		expect(screen.getByRole("button", { name: "Change design" })).toBeTruthy();
	});

	it("uses custom labels", () => {
		render(<PatternPicker clientId="abc" chooseLabel="Pick a layout" />);

		expect(screen.getByRole("button", { name: "Pick a layout" })).toBeTruthy();
	});

	it("replaces the inner blocks with the chosen pattern's blocks", () => {
		render(<PatternPicker clientId="abc" />);

		fireEvent.click(screen.getByRole("button", { name: "Choose pattern" }));
		fireEvent.click(screen.getByRole("button", { name: "Pattern Two" }));

		expect(mockReplaceInnerBlocks).toHaveBeenCalledWith(
			"abc",
			mockPatterns[1].blocks,
			false,
		);
	});

	it("closes the picker after a pattern is chosen", () => {
		render(<PatternPicker clientId="abc" />);

		fireEvent.click(screen.getByRole("button", { name: "Choose pattern" }));
		fireEvent.click(screen.getByRole("button", { name: "Pattern One" }));

		expect(screen.queryByRole("button", { name: "Pattern One" })).toBeNull();
	});
});

describe("usePatternsForBlock", () => {
	const Probe = ({ clientId }) => <p>{usePatternsForBlock(clientId).length}</p>;

	it("returns the matching patterns", () => {
		render(<Probe clientId="abc" />);

		expect(screen.getByText("2")).toBeTruthy();
	});

	it("returns none for an unknown block", () => {
		render(<Probe clientId="missing" />);

		expect(screen.getByText("0")).toBeTruthy();
		expect(mockPatternQueries).toEqual([]);
	});
});
