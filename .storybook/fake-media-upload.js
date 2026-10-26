/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import { Button, Modal } from "@wordpress/components";
import { addFilter } from "@wordpress/hooks";

// Placeholder files offered for each file type the media library is asked for.
const FILES = {
	image: [
		{ id: 1000, url: "https://example.com/uploads/image-1.jpg" },
		{ id: 1001, url: "https://example.com/uploads/image-2.jpg" },
	],
	video: [
		{ id: 2000, url: "https://example.com/uploads/clip-1.mp4" },
		{ id: 2001, url: "https://example.com/uploads/clip-2.mp4" },
	],
	"text/vtt": [{ id: 3000, url: "https://example.com/uploads/captions.vtt" }],
};

// Stands in for the media library, which only exists inside a WordPress editor.
const FakeMediaUpload = ({ allowedTypes = ["image"], onSelect, render }) => {
	const [isOpen, setIsOpen] = useState(false);
	const files = allowedTypes.flatMap((type) => FILES[type] || []);

	return (
		<>
			{render({ open: () => setIsOpen(true) })}
			{isOpen && (
				<Modal title="Media library (fixtures)" onRequestClose={() => setIsOpen(false)}>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						{files.map((file) => (
							<Button
								key={file.id}
								variant="secondary"
								onClick={() => {
									onSelect(file);
									setIsOpen(false);
								}}
							>
								{file.url.split("/").pop()}
							</Button>
						))}
					</div>
				</Modal>
			)}
		</>
	);
};

// MediaUploadCheck renders nothing unless the editor settings allow uploads.
export const MEDIA_EDITOR_SETTINGS = { mediaUpload: () => {} };

/**
 * Makes `MediaUpload` open a fake media library. Call once per story file.
 */
export const installFakeMediaUpload = () => {
	addFilter("editor.MediaUpload", "rkv-editor-components/storybook", () => FakeMediaUpload);
};
