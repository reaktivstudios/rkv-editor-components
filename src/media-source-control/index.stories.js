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
import MediaSourceControl from "./index.js";
import { usage } from "../../.storybook/usage.js";
import {
	MEDIA_EDITOR_SETTINGS,
	installFakeMediaUpload,
} from "../../.storybook/fake-media-upload.js";

installFakeMediaUpload();

// Holds the media, as a block's attributes would.
const Playground = ({ onChange, media: initialMedia, ...args }) => {
	const [media, setMedia] = useState(initialMedia);

	return (
		<BlockEditorProvider settings={MEDIA_EDITOR_SETTINGS}>
			<div style={{ width: 280, border: "1px solid #ddd" }}>
				<MediaSourceControl
					{...args}
					media={media}
					onChange={(changes) => {
						onChange(changes);
						setMedia((current) => ({ ...current, ...changes }));
					}}
				/>
			</div>
			<pre style={{ fontSize: 11 }}>{JSON.stringify(media, null, 2)}</pre>
		</BlockEditorProvider>
	);
};

export default {
	title: "Components/MediaSourceControl",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["MediaSourceControl"],
					omit: ["media"],
					extra: [
						"media={attributes.media}",
						"onChange={(changes) =>\n\tsetAttributes({ media: { ...attributes.media, ...changes } })\n}",
					],
				}),
			},
		},
	},
	component: MediaSourceControl,
	render: (args) => <Playground {...args} />,
	args: {
		media: { controls: true },
		onChange: fn(),
	},
	argTypes: {
		media: { control: false },
	},
};

export const VideoOnly = {};

export const ImageOrVideo = {
	args: {
		allowImageSource: true,
	},
};

export const YouTube = {
	args: {
		media: { source: "youtube", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ" },
	},
};

export const BackgroundVideo = {
	args: {
		backgroundVideo: true,
	},
};

export const WithPanelPrefix = {
	args: {
		allowImageSource: true,
		panelPrefix: "Desktop",
	},
};
