/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import Lightbox from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");

		return {
			Modal: ({ contentLabel, className, children }) =>
				el("div", { role: "dialog", "aria-label": contentLabel, className }, children),
			Button: ({ label, onClick }) =>
				el("button", { "aria-label": label, onClick }),
		};
	},
	{ virtual: true },
);

jest.mock(
	"@wordpress/icons",
	() => ({ chevronLeft: "chevronLeft", chevronRight: "chevronRight" }),
	{ virtual: true },
);

const ITEMS = [
	{ content: <img src="a.jpg" alt="A" />, caption: "Caption A" },
	{ content: <img src="b.jpg" alt="B" />, caption: "Caption B" },
	{ content: <iframe title="C" src="c.html" /> },
];

const renderLightbox = (props = {}) => {
	const onClose = jest.fn();

	const utils = render(
		<Lightbox isOpen items={ITEMS} onClose={onClose} {...props} />,
	);

	return { ...utils, onClose };
};

const shown = (container) =>
	[...container.querySelectorAll(".rkv-lightbox__item")].findIndex(
		(item) => "false" === item.getAttribute("aria-hidden"),
	);

describe("Lightbox", () => {
	it("renders nothing when closed", () => {
		const { container } = render(<Lightbox isOpen={false} items={ITEMS} />);

		expect(container.innerHTML).toBe("");
	});

	it("shows the first item and its caption, labelled for assistive technology", () => {
		const { container } = renderLightbox({ label: "Photo gallery" });

		expect(screen.getByRole("dialog", { name: "Photo gallery" })).toBeTruthy();
		expect(shown(container)).toBe(0);
		expect(screen.getByText("Caption A")).toBeTruthy();
	});

	it("has a default label", () => {
		renderLightbox();

		expect(screen.getByRole("dialog", { name: "Media viewer" })).toBeTruthy();
	});

	it("starts at initialIndex, kept within range", () => {
		const { container, unmount } = renderLightbox({ initialIndex: 1 });

		expect(shown(container)).toBe(1);

		unmount();
		const second = renderLightbox({ initialIndex: 99 });

		expect(shown(second.container)).toBe(2);
	});

	it("steps with the previous and next buttons, wrapping around", () => {
		const { container } = renderLightbox();

		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		expect(shown(container)).toBe(2);

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(shown(container)).toBe(0);

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(screen.getByText("Caption B")).toBeTruthy();
	});

	it("steps with the arrow keys", () => {
		const { container } = renderLightbox();

		fireEvent.keyDown(window, { key: "ArrowRight" });
		expect(shown(container)).toBe(1);

		fireEvent.keyDown(window, { key: "ArrowLeft" });
		expect(shown(container)).toBe(0);

		fireEvent.keyDown(window, { key: "ArrowUp" });
		expect(shown(container)).toBe(0);
	});

	it("jumps to an item with its dot", () => {
		const { container } = renderLightbox();

		fireEvent.click(screen.getByRole("button", { name: "Show item 3 of 3" }));

		expect(shown(container)).toBe(2);
		expect(
			screen.getByRole("button", { name: "Show item 3 of 3" }).getAttribute("aria-current"),
		).toBe("true");
	});

	it("shows no caption for an item without one", () => {
		const { container } = renderLightbox({ initialIndex: 2 });

		expect(container.querySelector(".rkv-lightbox__caption")).toBeNull();
	});

	it("hides navigation and ignores arrow keys with a single item", () => {
		const { container } = renderLightbox({ items: [ITEMS[0]] });

		expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
		expect(container.querySelector(".rkv-lightbox__dots")).toBeNull();

		fireEvent.keyDown(window, { key: "ArrowRight" });

		expect(shown(container)).toBe(0);
	});

	it("stops listening for keys once closed", () => {
		const { rerender, container } = renderLightbox();

		rerender(<Lightbox isOpen={false} items={ITEMS} />);
		fireEvent.keyDown(window, { key: "ArrowRight" });
		rerender(<Lightbox isOpen items={ITEMS} />);

		expect(shown(container)).toBe(0);
	});
});
