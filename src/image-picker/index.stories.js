/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import { Button, Modal } from "@wordpress/components";
import { BlockEditorProvider } from "@wordpress/block-editor";
import { addFilter } from "@wordpress/hooks";

/**
 * External dependencies
 */
import { fn } from "storybook/test";

/**
 * Internal dependencies
 */
import ImagePicker from "./index.js";
import { usage } from "../../.storybook/usage.js";

// Fixture attachment IDs from the mock API.
const LIBRARY_IDS = [1000, 1001, 1002, 1003];

// Stands in for the media library, which only exists inside a WordPress editor.
const FakeMediaUpload = ({ onSelect, render }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{render({ open: () => setIsOpen(true) })}
			{isOpen && (
				<Modal title="Media library (fixtures)" onRequestClose={() => setIsOpen(false)}>
					<div style={{ display: "flex", gap: 8 }}>
						{LIBRARY_IDS.map((id) => (
							<Button
								key={id}
								variant="secondary"
								onClick={() => {
									onSelect({ id });
									setIsOpen(false);
								}}
							>
								Image {id}
							</Button>
						))}
					</div>
				</Modal>
			)}
		</>
	);
};

addFilter("editor.MediaUpload", "rkv-editor-components/storybook", () => FakeMediaUpload);

// MediaUploadCheck renders nothing unless the editor settings allow uploads.
const SETTINGS = { mediaUpload: () => {} };

const Playground = ({ onChange, ...args }) => {
	const [value, setValue] = useState(args.value);

	return (
		<BlockEditorProvider settings={SETTINGS}>
			<div style={{ maxWidth: 280 }}>
				<ImagePicker
					{...args}
					value={value}
					onChange={(id, media) => {
						onChange(id, media);
						setValue(id);
					}}
				/>
			</div>
		</BlockEditorProvider>
	);
};

export default {
	title: "Components/ImagePicker",
	parameters: {
		docs: {
			source: {
				transform: usage({
					imports: ["ImagePicker"],
					omit: ["value"],
					extra: [
						"value={attributes.imageId}",
						"onChange={(id, media) => setAttributes({ imageId: id })}",
					],
				}),
			},
		},
	},
	component: ImagePicker,
	render: (args) => <Playground {...args} />,
	args: {
		label: "Image",
		onChange: fn(),
	},
	argTypes: {
		value: { control: false },
	},
};

export const Default = {};

export const WithImage = {
	args: {
		value: 1000,
	},
};

export const SquarePreview = {
	args: {
		value: 1001,
		aspectRatio: "1 / 1",
	},
};

export const WithHelpText = {
	args: {
		label: "Background image",
		help: "Shown behind the heading.",
	},
};
