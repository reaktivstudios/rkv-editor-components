/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import MetaControl, { useMetaValue } from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");

		const input = (type, valueProp) => (props) =>
			el(
				"label",
				null,
				props.label,
				el("input", {
					type,
					[valueProp]: props[valueProp] ?? "",
					"data-flags": Object.keys(props)
						.filter((key) => key.startsWith("__next"))
						.join(),
					onChange: (event) =>
						props.onChange(
							"checkbox" === type ? event.target.checked : event.target.value,
						),
				}),
			);

		return {
			TextControl: input("text", "value"),
			TextareaControl: input("text", "value"),
			ToggleControl: input("checkbox", "checked"),
			CheckboxControl: input("checkbox", "checked"),
			SelectControl: input("text", "value"),
			RangeControl: input("text", "value"),
			RadioControl: (props) =>
				el(
					"div",
					{ role: "radiogroup", "aria-label": props.label },
					props.options.map((option) =>
						el(
							"label",
							{ key: option.value },
							el("input", {
								type: "radio",
								checked: props.selected === option.value,
								onChange: () => props.onChange(option.value),
							}),
							option.label,
						),
					),
				),
			ColorPalette: ({ value, onChange }) =>
				el("button", { onClick: () => onChange("#ff0000") }, `color:${value}`),
		};
	},
	{ virtual: true },
);

let mockPostType;
let mockEntityArgs;
let mockMeta;
const mockSetMeta = jest.fn();

jest.mock(
	"@wordpress/data",
	() => ({
		useSelect: (mapper) =>
			mapper((store) => ("core/editor" === store ? { getCurrentPostType: () => mockPostType } : {})),
	}),
	{ virtual: true },
);

jest.mock(
	"@wordpress/core-data",
	() => ({
		useEntityProp: (...args) => {
			mockEntityArgs = args;
			return [mockMeta, mockSetMeta];
		},
	}),
	{ virtual: true },
);

beforeEach(() => {
	mockPostType = "post";
	mockMeta = { title_text: "Hello", featured: true };
	mockEntityArgs = null;
	mockSetMeta.mockClear();
});

describe("MetaControl", () => {
	it("shows the meta value in a text control by default", () => {
		render(<MetaControl metaKey="title_text" label="Title" />);

		expect(screen.getByLabelText("Title").value).toBe("Hello");
	});

	it("edits the meta of the current post, keeping its other values", () => {
		render(<MetaControl metaKey="title_text" label="Title" />);

		fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Bye" } });

		expect(mockEntityArgs).toEqual(["postType", "post", "meta", undefined]);
		expect(mockSetMeta).toHaveBeenCalledWith({ title_text: "Bye", featured: true });
	});

	it("uses the given post type and ID", () => {
		render(<MetaControl metaKey="title_text" label="Title" postType="video" postId={9} />);

		expect(mockEntityArgs).toEqual(["postType", "video", "meta", 9]);
	});

	it("calls onChange with the new value", () => {
		const onChange = jest.fn();
		render(<MetaControl metaKey="title_text" label="Title" onChange={onChange} />);

		fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Bye" } });

		expect(onChange).toHaveBeenCalledWith("Bye");
	});

	it("shows an empty value while the meta is unset", () => {
		mockMeta = undefined;

		render(<MetaControl metaKey="title_text" label="Title" />);

		expect(screen.getByLabelText("Title").value).toBe("");
	});

	it("binds a toggle to a boolean through its checked prop", () => {
		render(<MetaControl metaKey="featured" type="toggle" label="Featured" />);

		const toggle = screen.getByLabelText("Featured");

		expect(toggle.checked).toBe(true);

		fireEvent.click(toggle);

		expect(mockSetMeta).toHaveBeenCalledWith({ title_text: "Hello", featured: false });
	});

	it("shows toggles and checkboxes unchecked while the meta is unset", () => {
		mockMeta = {};

		render(
			<>
				<MetaControl metaKey="featured" type="toggle" label="Toggle" />
				<MetaControl metaKey="featured" type="checkbox" label="Checkbox" />
			</>,
		);

		expect(screen.getByLabelText("Toggle").checked).toBe(false);
		expect(screen.getByLabelText("Checkbox").checked).toBe(false);
	});

	it("binds a radio group through its selected prop", () => {
		mockMeta = { layout: "wide" };

		render(
			<MetaControl
				metaKey="layout"
				type="radio"
				label="Layout"
				options={[
					{ label: "Standard", value: "standard" },
					{ label: "Wide", value: "wide" },
				]}
			/>,
		);

		expect(screen.getByLabelText("Wide").checked).toBe(true);

		fireEvent.click(screen.getByLabelText("Standard"));

		expect(mockSetMeta).toHaveBeenCalledWith({ layout: "standard" });
	});

	it("supports a color palette", () => {
		mockMeta = { accent: "#00ff00" };

		render(<MetaControl metaKey="accent" type="color" />);

		fireEvent.click(screen.getByText("color:#00ff00"));

		expect(mockSetMeta).toHaveBeenCalledWith({ accent: "#ff0000" });
	});

	it("passes the other props through, without overriding the value", () => {
		const { container } = render(
			<MetaControl metaKey="title_text" label="Title" value="ignored" />,
		);

		expect(screen.getByLabelText("Title").value).toBe("Hello");
		expect(container.querySelector("input").dataset.flags).toBe(
			"__nextHasNoMarginBottom,__next40pxDefaultSize",
		);
	});

	it("falls back to a text control for an unknown type", () => {
		render(<MetaControl metaKey="title_text" type="bogus" label="Title" />);

		expect(screen.getByLabelText("Title").value).toBe("Hello");
	});
});

describe("useMetaValue", () => {
	const Probe = ({ options }) => {
		const [value, setValue] = useMetaValue("title_text", options);

		return <button onClick={() => setValue("Next")}>{String(value)}</button>;
	};

	it("returns the value and a setter that keeps the other meta", () => {
		render(<Probe />);

		fireEvent.click(screen.getByRole("button", { name: "Hello" }));

		expect(mockSetMeta).toHaveBeenCalledWith({ title_text: "Next", featured: true });
	});

	it("returns undefined for a missing key", () => {
		mockMeta = {};

		render(<Probe />);

		expect(screen.getByRole("button", { name: "undefined" })).toBeTruthy();
	});

	it("prefers an explicit post type over the current one", () => {
		render(<Probe options={{ postType: "page", postId: 3 }} />);

		expect(mockEntityArgs).toEqual(["postType", "page", "meta", 3]);
	});
});
