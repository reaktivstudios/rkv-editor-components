/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import { BlockEditorProvider } from "@wordpress/block-editor";

/**
 * External dependencies
 */
import { fn } from "storybook/test";

/**
 * Internal dependencies
 */
import ViewportMediaControls, { DEFAULT_MEDIA } from "./index.js";
import { usage } from "../../.storybook/usage.js";
import {
	MEDIA_EDITOR_SETTINGS,
	installFakeMediaUpload,
} from "../../.storybook/fake-media-upload.js";

installFakeMediaUpload();

// Holds the media for each viewport, as a block's attributes would.
const Playground = ({ onChange, value: initialValue, ...args }) => {
	const [value, setValue] = useState(initialValue);

	return (
		<BlockEditorProvider settings={MEDIA_EDITOR_SETTINGS}>
			<div style={{ width: 280, border: "1px solid #ddd" }}>
				<ViewportMediaControls
					{...args}
					value={value}
					onChange={(next) => {
						onChange(next);
						setValue(next);
					}}
				/>
			</div>
		</BlockEditorProvider>
	);
};

export default {
	title: "Components/ViewportMediaControls",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["ViewportMediaControls"],
					omit: ["value"],
					extra: [
						"value={{\n\tdesktop: attributes.desktopMedia,\n\ttablet: attributes.tabletMedia,\n\tmobile: attributes.mobileMedia,\n}}",
						"onChange={({ desktop, tablet, mobile }) =>\n\tsetAttributes({\n\t\tdesktopMedia: desktop,\n\t\ttabletMedia: tablet,\n\t\tmobileMedia: mobile,\n\t})\n}",
					],
				}),
			},
		},
	},
	component: ViewportMediaControls,
	render: (args) => <Playground {...args} />,
	args: {
		value: { desktop: { ...DEFAULT_MEDIA }, tablet: {}, mobile: {} },
		onChange: fn(),
	},
	argTypes: {
		value: { control: false },
	},
};

export const Default = {};

export const WithTabletOverride = {
	args: {
		value: {
			desktop: { ...DEFAULT_MEDIA },
			tablet: { ...DEFAULT_MEDIA, imageId: 1001 },
			mobile: {},
		},
	},
};

export const BackgroundVideo = {
	args: {
		backgroundVideo: true,
		value: {
			desktop: { ...DEFAULT_MEDIA, type: "video" },
			tablet: {},
			mobile: {},
		},
	},
};
