/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import ViewportMediaControls, { DEFAULT_MEDIA } from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");

		return {
			PanelBody: ({ title, children }) =>
				el("section", { "aria-label": title }, children),
			ToggleControl: ({ label, checked, onChange }) =>
				el(
					"label",
					null,
					label,
					el("input", {
						type: "checkbox",
						checked,
						onChange: (event) => onChange(event.target.checked),
					}),
				),
		};
	},
	{ virtual: true },
);

// Records the props of each viewport's control, and lets a test change its media.
let mockControls;

jest.mock("../media-source-control/index.js", () => {
	const { createElement: el } = require("@wordpress/element");

	return {
		__esModule: true,
		default: (props) => {
			mockControls[props.panelPrefix] = props;
			return el("div", { "data-testid": props.panelPrefix });
		},
	};
});

const renderControls = (value, props = {}) => {
	const onChange = jest.fn();

	const utils = render(
		<ViewportMediaControls value={value} onChange={onChange} {...props} />,
	);

	return { ...utils, onChange };
};

const toggle = (name) => screen.getByLabelText(`Use a different asset for ${name}`);

beforeEach(() => {
	mockControls = {};
});

describe("ViewportMediaControls", () => {
	it("always shows the desktop media control", () => {
		renderControls({ desktop: { type: "image" } });

		expect(mockControls.Desktop.media).toEqual({ type: "image" });
		expect(mockControls.Desktop.allowImageSource).toBe(true);
	});

	it("hides tablet and mobile controls until overridden", () => {
		renderControls({ desktop: DEFAULT_MEDIA });

		expect(screen.queryByTestId("Tablet")).toBeNull();
		expect(screen.queryByTestId("Mobile")).toBeNull();
		expect(toggle("tablet").checked).toBe(false);
	});

	it("shows an override's control when its media has a type", () => {
		renderControls({ desktop: DEFAULT_MEDIA, tablet: DEFAULT_MEDIA });

		expect(toggle("tablet").checked).toBe(true);
		expect(screen.getByTestId("Tablet")).toBeTruthy();
		expect(screen.queryByTestId("Mobile")).toBeNull();
	});

	it("starts an override from DEFAULT_MEDIA", () => {
		const { onChange } = renderControls({ desktop: { type: "video" } });

		fireEvent.click(toggle("mobile"));

		expect(onChange).toHaveBeenCalledWith({
			desktop: { type: "video" },
			tablet: {},
			mobile: DEFAULT_MEDIA,
		});
	});

	it("resets an override when it's turned off", () => {
		const { onChange } = renderControls({
			desktop: DEFAULT_MEDIA,
			tablet: { ...DEFAULT_MEDIA, imageId: 5 },
		});

		fireEvent.click(toggle("tablet"));

		expect(onChange).toHaveBeenCalledWith({
			desktop: DEFAULT_MEDIA,
			tablet: {},
			mobile: {},
		});
	});

	it("merges a viewport's changes into only that viewport", () => {
		const { onChange } = renderControls({
			desktop: DEFAULT_MEDIA,
			tablet: { ...DEFAULT_MEDIA, imageId: 5 },
		});

		mockControls.Tablet.onChange({ imageId: 9, imageUrl: "nine.jpg" });

		expect(onChange).toHaveBeenCalledWith({
			desktop: DEFAULT_MEDIA,
			tablet: { ...DEFAULT_MEDIA, imageId: 9, imageUrl: "nine.jpg" },
			mobile: {},
		});
	});

	it("passes backgroundVideo to each control", () => {
		renderControls(
			{ desktop: DEFAULT_MEDIA, tablet: DEFAULT_MEDIA, mobile: DEFAULT_MEDIA },
			{ backgroundVideo: true },
		);

		expect(mockControls.Desktop.backgroundVideo).toBe(true);
		expect(mockControls.Tablet.backgroundVideo).toBe(true);
		expect(mockControls.Mobile.backgroundVideo).toBe(true);
	});
});
