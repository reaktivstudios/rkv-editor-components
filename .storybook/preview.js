/**
 * WordPress dependencies
 */
import apiFetch from "@wordpress/api-fetch";
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";

/**
 * Internal dependencies
 */
import mockApiMiddleware from "./mock-api.js";
import "./preview.css";

// Answer every REST request from fixtures instead of a WordPress site.
apiFetch.use(mockApiMiddleware);

/** @type { import('@storybook/react-vite').Preview } */
export default {
	parameters: {
		layout: "padded",
		controls: { expanded: true },
		options: {
			// The introduction is first, so Storybook opens on it.
			storySort: { order: ["Introduction", "Components"] },
		},
	},
};
