/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import ImagePicker from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");

		return {
			BaseControl: ({ label, help, className, children }) =>
				el(
					"div",
					{ className },
					el("label", null, label),
					children,
					help && el("p", null, help),
				),
			Button: ({ children, onClick, className, style }) =>
				el("button", { onClick, className, style }, children),
			__experimentalHStack: ({ children }) => el("div", null, children),
		};
	},
	{ virtual: true },
);

jest.mock("@wordpress/core-data", () => ({ store: "core" }), { virtual: true });

let mockMedia;
let mockMediaRequests;

jest.mock(
	"@wordpress/data",
	() => ({
		useSelect: (mapper) =>
			mapper(() => ({
				getMedia: (id) => {
					mockMediaRequests.push(id);
					return mockMedia;
				},
			})),
	}),
	{ virtual: true },
);

// The media library, stood in for by a button that "picks" an attachment.
const mockAttachment = { id: 42, url: "picked.jpg" };

jest.mock(
	"@wordpress/block-editor",
	() => ({
		MediaUploadCheck: ({ children }) => children,
		MediaUpload: ({ onSelect, render }) =>
			render({ open: () => onSelect(mockAttachment) }),
	}),
	{ virtual: true },
);

beforeEach(() => {
	mockMedia = undefined;
	mockMediaRequests = [];
});

describe("ImagePicker", () => {
	it("offers to choose an image when empty", () => {
		render(<ImagePicker onChange={jest.fn()} />);

		expect(screen.getByRole("button", { name: "Choose an image" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Replace" })).toBeNull();
		expect(mockMediaRequests).toEqual([]);
	});

	it("reports the chosen attachment's ID and record", () => {
		const onChange = jest.fn();
		render(<ImagePicker onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Choose an image" }));

		expect(onChange).toHaveBeenCalledWith(42, mockAttachment);
	});

	it("previews the requested size of the stored image", () => {
		mockMedia = {
			source_url: "full.jpg",
			media_details: {
				sizes: { large: { source_url: "large.jpg" }, thumbnail: { source_url: "thumb.jpg" } },
			},
		};

		render(<ImagePicker value={7} imageSize="thumbnail" onChange={jest.fn()} />);

		expect(mockMediaRequests).toEqual([7]);
		expect(screen.getByRole("img").getAttribute("src")).toBe("thumb.jpg");
	});

	it("falls back to the original image when the size doesn't exist", () => {
		mockMedia = { source_url: "full.jpg", media_details: { sizes: {} } };

		render(<ImagePicker value={7} onChange={jest.fn()} />);

		expect(screen.getByRole("img").getAttribute("src")).toBe("full.jpg");
	});

	it("shows Replace and Remove once an image is set", () => {
		mockMedia = { source_url: "full.jpg" };
		const onChange = jest.fn();

		render(<ImagePicker value={7} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Replace" }));
		expect(onChange).toHaveBeenLastCalledWith(42, mockAttachment);

		fireEvent.click(screen.getByRole("button", { name: "Remove" }));
		expect(onChange).toHaveBeenLastCalledWith(null, null);
	});

	it("renders the label, help, className and aspect ratio", () => {
		const { container } = render(
			<ImagePicker
				label="Hero"
				help="Shown at the top"
				className="custom"
				aspectRatio="1 / 1"
				onChange={jest.fn()}
			/>,
		);

		expect(screen.getByText("Hero")).toBeTruthy();
		expect(screen.getByText("Shown at the top")).toBeTruthy();
		expect(container.querySelector(".rkv-image-picker.custom")).toBeTruthy();
		expect(container.querySelector(".rkv-image-picker__preview").style.aspectRatio).toBe("1 / 1");
	});
});
