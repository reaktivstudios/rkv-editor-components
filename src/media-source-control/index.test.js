/**
 * External dependencies
 */
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Internal dependencies
 */
import MediaSourceControl from "./index.js";

jest.mock(
	"@wordpress/components",
	() => {
		const { createElement: el } = require("@wordpress/element");

		return {
			PanelBody: ({ title, children }) =>
				el("section", { "aria-label": title }, children),
			PanelRow: ({ children }) => el("div", null, children),
			Button: ({ children, onClick }) => el("button", { onClick }, children),
			Notice: ({ children }) => el("div", { role: "alert" }, children),
			RadioControl: ({ label, selected, options, onChange }) =>
				el(
					"div",
					{ role: "radiogroup", "aria-label": label },
					options.map((option) =>
						el(
							"label",
							{ key: option.value },
							el("input", {
								type: "radio",
								checked: selected === option.value,
								onChange: () => onChange(option.value),
							}),
							option.label,
						),
					),
				),
			TextControl: ({ label, value, onChange }) =>
				el(
					"label",
					null,
					label,
					el("input", { value, onChange: (event) => onChange(event.target.value) }),
				),
			ToggleControl: ({ label, checked, disabled, onChange }) =>
				el(
					"label",
					null,
					label,
					el("input", {
						type: "checkbox",
						checked,
						disabled,
						onChange: (event) => onChange(event.target.checked),
					}),
				),
		};
	},
	{ virtual: true },
);

// The media library, stood in for by a button per file type that "picks" a file.
jest.mock(
	"@wordpress/block-editor",
	() => ({
		MediaUploadCheck: ({ children }) => children,
		MediaUpload: ({ allowedTypes, onSelect, render: renderToggle }) =>
			renderToggle({
				open: () =>
					onSelect({ id: 7, url: `${allowedTypes[0].replace("/", "-")}.file` }),
			}),
	}),
	{ virtual: true },
);

const renderControl = (media = {}, props = {}) => {
	const onChange = jest.fn();

	const utils = render(
		<MediaSourceControl media={media} onChange={onChange} {...props} />,
	);

	return { ...utils, onChange };
};

describe("MediaSourceControl", () => {
	describe("video only", () => {
		it("has no media type toggle and starts as a self-hosted video", () => {
			renderControl();

			expect(screen.queryByRole("radiogroup", { name: "Type" })).toBeNull();
			expect(screen.getByRole("button", { name: "Select video" })).toBeTruthy();
			expect(screen.getByRole("radiogroup", { name: "Source" })).toBeTruthy();
		});

		it("reports the selected video", () => {
			const { onChange } = renderControl();

			fireEvent.click(screen.getByRole("button", { name: "Select video" }));

			expect(onChange).toHaveBeenCalledWith({ videoId: 7, videoUrl: "video.file" });
		});

		it("offers to replace or remove a chosen video", () => {
			const { onChange } = renderControl({ videoId: 7, videoUrl: "clip.mp4" });

			expect(screen.getByRole("button", { name: "Replace video" })).toBeTruthy();

			fireEvent.click(screen.getByRole("button", { name: "Remove video" }));

			expect(onChange).toHaveBeenCalledWith({ videoId: 0, videoUrl: "" });
		});

		it("picks and clears the poster and captions", () => {
			const { onChange } = renderControl({
				posterId: 3,
				captionsId: 4,
				captionsUrl: "a.vtt",
			});

			fireEvent.click(screen.getByRole("button", { name: "Replace poster image" }));
			expect(onChange).toHaveBeenLastCalledWith({ posterId: 7, posterUrl: "image.file" });

			fireEvent.click(screen.getByRole("button", { name: "Remove poster image" }));
			expect(onChange).toHaveBeenLastCalledWith({ posterId: 0, posterUrl: "" });

			fireEvent.click(screen.getByRole("button", { name: "Replace captions (.vtt)" }));
			expect(onChange).toHaveBeenLastCalledWith({ captionsId: 7, captionsUrl: "text-vtt.file" });

			fireEvent.click(screen.getByRole("button", { name: "Remove captions" }));
			expect(onChange).toHaveBeenLastCalledWith({ captionsId: 0, captionsUrl: "" });
		});

		it("warns about missing captions until a file is added", () => {
			const { rerender, onChange } = renderControl();

			expect(screen.getByRole("alert").textContent).toMatch(/No captions file/);

			rerender(<MediaSourceControl media={{ captionsUrl: "a.vtt" }} onChange={onChange} />);

			expect(screen.queryByRole("alert")).toBeNull();
		});

		it("switches to a YouTube URL field", () => {
			const { onChange } = renderControl({ source: "youtube", youtubeUrl: "" });

			expect(screen.queryByRole("button", { name: "Select video" })).toBeNull();

			fireEvent.change(screen.getByLabelText("YouTube URL"), {
				target: { value: "https://youtu.be/abc" },
			});

			expect(onChange).toHaveBeenCalledWith({ youtubeUrl: "https://youtu.be/abc" });
		});

		it("changes the source and the title", () => {
			const { onChange } = renderControl();

			fireEvent.click(screen.getByLabelText("YouTube"));
			expect(onChange).toHaveBeenLastCalledWith({ source: "youtube" });

			fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Intro" } });
			expect(onChange).toHaveBeenLastCalledWith({ title: "Intro" });
		});
	});

	describe("playback settings", () => {
		it("mutes the video when autoplay is turned on", () => {
			const { onChange } = renderControl({ muted: false });

			fireEvent.click(screen.getByLabelText("Autoplay"));

			expect(onChange).toHaveBeenCalledWith({ autoplay: true, muted: true });
		});

		it("keeps the muted setting when autoplay is turned off", () => {
			const { onChange } = renderControl({ autoplay: true, muted: true });

			fireEvent.click(screen.getByLabelText("Autoplay"));

			expect(onChange).toHaveBeenCalledWith({ autoplay: false, muted: true });
		});

		it("locks the muted toggle while autoplaying", () => {
			renderControl({ autoplay: true, muted: true });

			expect(screen.getByLabelText("Muted").disabled).toBe(true);
		});

		it("warns about unmuted autoplay", () => {
			renderControl({ autoplay: true, muted: false, captionsUrl: "a.vtt" });

			expect(screen.getByRole("alert").textContent).toMatch(/unmuted video/);
		});

		it("changes loop and player controls", () => {
			const { onChange } = renderControl({ loop: false, controls: true });

			fireEvent.click(screen.getByLabelText("Loop"));
			expect(onChange).toHaveBeenLastCalledWith({ loop: true });

			fireEvent.click(screen.getByLabelText("Show player controls"));
			expect(onChange).toHaveBeenLastCalledWith({ controls: false });
		});
	});

	describe("allowImageSource", () => {
		it("starts as an image and reports a selected image", () => {
			const { onChange } = renderControl({}, { allowImageSource: true });

			expect(screen.getByRole("radiogroup", { name: "Type" })).toBeTruthy();
			expect(screen.queryByRole("radiogroup", { name: "Source" })).toBeNull();

			fireEvent.click(screen.getByRole("button", { name: "Select image" }));

			expect(onChange).toHaveBeenCalledWith({ imageId: 7, imageUrl: "image.file" });
		});

		it("clears a chosen image", () => {
			const { onChange } = renderControl({ imageId: 7 }, { allowImageSource: true });

			fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

			expect(onChange).toHaveBeenCalledWith({ imageId: 0, imageUrl: "" });
		});

		it("switches between image and video", () => {
			const { onChange } = renderControl({}, { allowImageSource: true });

			fireEvent.click(screen.getByLabelText("Video"));

			expect(onChange).toHaveBeenCalledWith({ type: "video" });
		});

		it("shows the video panels for the video type", () => {
			renderControl({ type: "video" }, { allowImageSource: true });

			expect(screen.getByRole("button", { name: "Select video" })).toBeTruthy();
			expect(screen.queryByRole("button", { name: "Select image" })).toBeNull();
		});
	});

	describe("backgroundVideo", () => {
		it("hides the source, title, captions, and playback settings", () => {
			renderControl({ source: "youtube" }, { backgroundVideo: true });

			expect(screen.queryByRole("radiogroup", { name: "Source" })).toBeNull();
			expect(screen.queryByLabelText("Title")).toBeNull();
			expect(screen.queryByRole("button", { name: /captions/ })).toBeNull();
			expect(screen.queryByLabelText("Autoplay")).toBeNull();
			expect(screen.getByRole("button", { name: "Select video" })).toBeTruthy();
			expect(screen.getByText(/muted, looping background/)).toBeTruthy();
		});
	});

	it("prefixes the panel titles", () => {
		renderControl({}, { allowImageSource: true, panelPrefix: "Tablet" });

		expect(screen.getByRole("region", { name: "Tablet Media type" })).toBeTruthy();
		expect(screen.getByRole("region", { name: "Tablet Image" })).toBeTruthy();
	});
});
