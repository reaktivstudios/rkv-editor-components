/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";
import {
	Button,
	BaseControl,
	__experimentalHStack as HStack,
} from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { store as coreStore } from "@wordpress/core-data";

/**
 * External dependencies
 */
import classnames from "classnames";

/**
 * Internal dependencies
 */
import "./editor.scss";

const ALLOWED_TYPES = ["image"];

/**
 * An image field: a preview of the chosen image that opens the media library,
 * with Replace and Remove actions once an image is set.
 *
 * @param {Object}   props
 * @param {number}   props.value       Attachment ID of the image; empty or 0 for none.
 * @param {Function} props.onChange    Called with `(id, media)` when an image is chosen, or `(null, null)` when removed.
 * @param {string}   props.label       Field label.
 * @param {string}   props.help        Help text under the field.
 * @param {string}   props.className   Extra class for the field.
 * @param {string}   props.imageSize   Image size to preview; falls back to the original image.
 * @param {string}   props.aspectRatio CSS aspect ratio of the preview.
 */
const ImagePicker = ({
	value,
	onChange,
	label,
	help,
	className,
	imageSize = "large",
	aspectRatio = "2 / 1",
}) => {
	const hasImage = Number(value) > 0;

	// Get the media record from the server when the image ID changes.
	const media = useSelect(
		(select) => (hasImage ? select(coreStore).getMedia(value) : undefined),
		[value],
	);

	const previewUrl =
		media?.media_details?.sizes?.[imageSize]?.source_url || media?.source_url;

	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={label}
			help={help}
			className={classnames("rkv-image-picker", className)}
		>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ALLOWED_TYPES}
					onSelect={(image) => onChange(image.id, image)}
					value={value}
					render={({ open }) => (
						<>
							<Button
								className={classnames("rkv-image-picker__preview", {
									"has-image": hasImage,
								})}
								onClick={open}
								aria-haspopup="dialog"
								style={{ aspectRatio }}
							>
								{hasImage ? (
									previewUrl && (
										<img
											src={previewUrl}
											alt={__("Selected image", "rkv-editor-components")}
										/>
									)
								) : (
									__("Choose an image", "rkv-editor-components")
								)}
							</Button>
							{hasImage && (
								<HStack className="rkv-image-picker__actions" justify="flex-start">
									<Button
										variant="secondary"
										__next40pxDefaultSize
										onClick={open}
										aria-haspopup="dialog"
									>
										{__("Replace", "rkv-editor-components")}
									</Button>
									<Button
										variant="secondary"
										isDestructive
										__next40pxDefaultSize
										onClick={() => onChange(null, null)}
									>
										{__("Remove", "rkv-editor-components")}
									</Button>
								</HStack>
							)}
						</>
					)}
				/>
			</MediaUploadCheck>
		</BaseControl>
	);
};

export default ImagePicker;
