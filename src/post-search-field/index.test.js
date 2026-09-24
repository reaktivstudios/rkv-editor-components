/**
 * External dependencies
 */
import { act, render, screen, waitFor } from "@testing-library/react";

/**
 * Internal dependencies
 */
import PostSearchField from "./index.js";
import fetchPostSuggestions from "./fetch-post-suggestions.js";

jest.mock("./fetch-post-suggestions.js", () => jest.fn());

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");
		return {
			BaseControl: ({ label, help, className, children }) =>
				el("div", { className }, el("label", null, label), children, help && el("p", null, help)),
		};
	},
	{ virtual: true },
);

const mockRegistry = { name: "registry" };

jest.mock("@wordpress/data", () => ({ useRegistry: () => mockRegistry }), {
	virtual: true,
});

// Stand-in for LinkControlSearchInput that records its latest props so tests
// can act as the input: type, pick a suggestion, or request suggestions.
let mockInputProps;

jest.mock(
	"@wordpress/block-editor",
	() => {
		const { createElement: el } = require("@wordpress/element");
		return {
			__experimentalLinkControlSearchInput: (props) => {
				mockInputProps = props;
				return el("input", { readOnly: true, value: props.value });
			},
		};
	},
	{ virtual: true },
);

const suggestion = (id, title) => ({
	id,
	title,
	url: `/${id}`,
	type: "post",
	kind: "post-type",
	postType: "post",
});

const input = () => screen.getByRole("textbox");

beforeEach(() => {
	mockInputProps = undefined;
	fetchPostSuggestions.mockReset();
	fetchPostSuggestions.mockResolvedValue([]);
});

describe("PostSearchField", () => {
	it("fetches suggestions with the queryArgs", async () => {
		const queryArgs = { postType: ["post", "video"], categories: [3] };
		fetchPostSuggestions.mockResolvedValue([suggestion(1, "Alpha")]);

		render(<PostSearchField queryArgs={queryArgs} onChange={jest.fn()} />);

		const results = await mockInputProps.fetchSuggestions("alp", {});

		expect(fetchPostSuggestions).toHaveBeenCalledWith(mockRegistry, "alp", queryArgs);
		expect(results).toEqual([suggestion(1, "Alpha")]);
	});

	it("configures the input for posts only", () => {
		render(<PostSearchField onChange={jest.fn()} />);

		expect(mockInputProps).toMatchObject({
			allowDirectEntry: false,
			withURLSuggestion: false,
			withCreateSuggestion: false,
			showInitialSuggestions: true,
		});
	});

	it("keeps the fetcher stable across renders with equal queryArgs", () => {
		const { rerender } = render(
			<PostSearchField queryArgs={{ postType: "post" }} onChange={jest.fn()} />,
		);
		const firstFetcher = mockInputProps.fetchSuggestions;

		rerender(<PostSearchField queryArgs={{ postType: "post" }} onChange={jest.fn()} />);
		expect(mockInputProps.fetchSuggestions).toBe(firstFetcher);

		rerender(<PostSearchField queryArgs={{ postType: "page" }} onChange={jest.fn()} />);
		expect(mockInputProps.fetchSuggestions).not.toBe(firstFetcher);
	});

	it("selects a suggestion and shows its title", () => {
		const onChange = jest.fn();
		render(<PostSearchField onChange={onChange} />);

		act(() => mockInputProps.onSelect(suggestion(7, "Seven")));

		expect(onChange).toHaveBeenCalledWith(7, suggestion(7, "Seven"));
		expect(input().value).toBe("Seven");
		// Suggestions stay closed while the input shows the selected title.
		expect(mockInputProps.currentLink).toEqual({ url: "Seven" });
	});

	it("ignores submitting typed text without a suggestion", () => {
		const onChange = jest.fn();
		render(<PostSearchField onChange={onChange} />);

		act(() => mockInputProps.onSelect({ url: "typed text" }));

		expect(onChange).not.toHaveBeenCalled();
	});

	it("clears the selection when the input is emptied", () => {
		const onChange = jest.fn();
		const { rerender } = render(<PostSearchField onChange={onChange} />);

		act(() => mockInputProps.onSelect(suggestion(7, "Seven")));
		rerender(<PostSearchField value={7} onChange={onChange} />);
		act(() => mockInputProps.onChange(""));

		expect(onChange).toHaveBeenLastCalledWith(null, null);
		expect(mockInputProps.currentLink).toEqual({});
	});

	it("doesn't report a change when typing without a selection", () => {
		const onChange = jest.fn();
		render(<PostSearchField onChange={onChange} />);

		act(() => mockInputProps.onChange("al"));
		act(() => mockInputProps.onChange(""));

		expect(onChange).not.toHaveBeenCalled();
	});

	it("looks up and shows the title of an initial value", async () => {
		fetchPostSuggestions.mockResolvedValue([suggestion(9, "Nine")]);

		render(
			<PostSearchField
				value={9}
				queryArgs={{ postType: ["post", "page"] }}
				onChange={jest.fn()}
			/>,
		);

		await waitFor(() => expect(input().value).toBe("Nine"));
		expect(fetchPostSuggestions).toHaveBeenCalledWith(mockRegistry, "", {
			postType: ["post", "page"],
			include: [9],
			orderby: "include",
		});
	});

	it("doesn't look up a value it just selected", () => {
		const onChange = jest.fn();
		const { rerender } = render(<PostSearchField onChange={onChange} />);

		act(() => mockInputProps.onSelect(suggestion(7, "Seven")));
		rerender(<PostSearchField value={7} onChange={onChange} />);

		expect(fetchPostSuggestions).not.toHaveBeenCalled();
	});

	it("clears the input when the parent clears value", async () => {
		fetchPostSuggestions.mockResolvedValue([suggestion(9, "Nine")]);
		const { rerender } = render(<PostSearchField value={9} onChange={jest.fn()} />);
		await waitFor(() => expect(input().value).toBe("Nine"));

		rerender(<PostSearchField value={null} onChange={jest.fn()} />);

		expect(input().value).toBe("");
	});

	it("renders the label, help, and class name", () => {
		const { container } = render(
			<PostSearchField
				label="Featured post"
				help="Pick one post."
				className="my-field"
				onChange={jest.fn()}
			/>,
		);

		expect(screen.getByText("Featured post")).toBeTruthy();
		expect(screen.getByText("Pick one post.")).toBeTruthy();
		expect(container.querySelector(".rkv-post-search-field.my-field")).toBeTruthy();
	});
});
