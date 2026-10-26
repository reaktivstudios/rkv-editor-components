/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Internal dependencies
 */
import DraggableList from "./index.js";

const mockSpeak = jest.fn();

jest.mock("@wordpress/a11y", () => ({ speak: (...args) => mockSpeak(...args) }), {
	virtual: true,
});

const dataTransfer = () => ({
	effectAllowed: "",
	dropEffect: "",
	setData: jest.fn(),
	setDragImage: jest.fn(),
});

const renderList = (props = {}, labels = ["A", "B", "C"]) => {
	const onReorder = jest.fn();

	const utils = render(
		<DraggableList onReorder={onReorder} {...props}>
			{labels.map((label) => (
				<span key={label}>{label}</span>
			))}
		</DraggableList>,
	);

	return { ...utils, onReorder };
};

const item = (label) => screen.getByText(label).parentElement;

beforeEach(() => {
	mockSpeak.mockClear();
	jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
		setTimeout(callback, 0),
	);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("DraggableList", () => {
	it("renders each child as a draggable list item", () => {
		renderList();

		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(item("A").getAttribute("draggable")).toBe("true");
		expect(item("A").getAttribute("data-index")).toBe("0");
	});

	it("applies orientation, className and extra props to the list", () => {
		const { container } = renderList({
			orientation: "horizontal",
			className: "custom",
			"aria-label": "Slides",
		});

		const list = container.firstChild;

		expect(list.className).toContain("rkv-draggable-list--horizontal");
		expect(list.className).toContain("custom");
		expect(list.getAttribute("aria-label")).toBe("Slides");
	});

	it("isn't draggable with a single item", () => {
		renderList({}, ["A"]);

		expect(item("A").getAttribute("draggable")).toBe("false");
		expect(item("A").getAttribute("tabindex")).toBeNull();
	});

	it("keeps a child with draggable={false} in place", () => {
		render(
			<DraggableList onReorder={jest.fn()}>
				<span key="A">A</span>
				<span key="B" draggable={false}>
					B
				</span>
			</DraggableList>,
		);

		expect(item("A").getAttribute("draggable")).toBe("true");
		expect(item("B").getAttribute("draggable")).toBe("false");
	});

	it("reports a drop on another item and announces it", () => {
		const { onReorder } = renderList();
		const transfer = dataTransfer();

		fireEvent.dragStart(item("A"), { dataTransfer: transfer });

		expect(item("A").className).toContain("is-dragging");

		fireEvent.dragEnter(item("C"));

		expect(item("C").className).toContain("is-over");

		fireEvent.drop(item("C"));

		expect(onReorder).toHaveBeenCalledWith({ fromIndex: 0, toIndex: 2 });
		expect(mockSpeak).toHaveBeenCalledWith("Item moved from position 1 to position 3");
		expect(item("A").className).not.toContain("is-dragging");
		expect(item("C").className).not.toContain("is-over");
	});

	it("does nothing when dropped on itself", () => {
		const { onReorder } = renderList();

		fireEvent.dragStart(item("B"), { dataTransfer: dataTransfer() });
		fireEvent.drop(item("B"));

		expect(onReorder).not.toHaveBeenCalled();
	});

	it("clears the drag state when the drag is cancelled", () => {
		renderList();

		fireEvent.dragStart(item("A"), { dataTransfer: dataTransfer() });
		fireEvent.dragEnd(item("A"));

		expect(item("A").className).not.toContain("is-dragging");
	});

	it("ignores drags that didn't start in the list", () => {
		renderList();

		fireEvent.dragEnter(item("B"));

		expect(item("B").className).not.toContain("is-over");
	});

	it("moves an item with the arrow keys", () => {
		const { onReorder } = renderList();

		fireEvent.keyDown(item("B"), { key: "ArrowUp" });
		expect(onReorder).toHaveBeenLastCalledWith({ fromIndex: 1, toIndex: 0 });

		fireEvent.keyDown(item("B"), { key: "ArrowDown" });
		expect(onReorder).toHaveBeenLastCalledWith({ fromIndex: 1, toIndex: 2 });
	});

	it("doesn't move past either end", () => {
		const { onReorder } = renderList();

		fireEvent.keyDown(item("A"), { key: "ArrowUp" });
		fireEvent.keyDown(item("C"), { key: "ArrowDown" });

		expect(onReorder).not.toHaveBeenCalled();
	});

	it("uses the left and right arrows when horizontal", () => {
		const { onReorder } = renderList({ orientation: "horizontal" });

		fireEvent.keyDown(item("B"), { key: "ArrowUp" });
		expect(onReorder).not.toHaveBeenCalled();

		fireEvent.keyDown(item("B"), { key: "ArrowRight" });
		expect(onReorder).toHaveBeenCalledWith({ fromIndex: 1, toIndex: 2 });
	});

	it("leaves arrow keys alone inside an item's own controls", () => {
		const { onReorder } = renderList();

		fireEvent.keyDown(screen.getByText("B"), { key: "ArrowDown" });

		expect(onReorder).not.toHaveBeenCalled();
	});

	it("returns focus to the moved item", async () => {
		const { rerender } = render(
			<DraggableList
				onReorder={() => {
					// Re-render with B first, as a parent would.
					rerender(
						<DraggableList onReorder={jest.fn()}>
							<span key="B">B</span>
							<span key="A">A</span>
						</DraggableList>,
					);
				}}
			>
				<span key="A">A</span>
				<span key="B">B</span>
			</DraggableList>,
		);

		item("B").focus();
		fireEvent.keyDown(item("B"), { key: "ArrowUp" });

		await waitFor(() => expect(document.activeElement).toBe(item("B")));
		expect(item("B").getAttribute("data-index")).toBe("0");
	});
});
