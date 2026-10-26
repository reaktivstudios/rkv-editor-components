/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";
import {
	Button,
	Notice,
	PanelBody,
	PanelRow,
	RadioControl,
	TextControl,
	ToggleControl,
} from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";

const MEDIA_TYPE_OPTIONS = [
	{ label: __("Image", "rkv-editor-components"), value: "image" },
	{ label: __("Video", "rkv-editor-components"), value: "video" },
];

const VIDEO_SOURCE_OPTIONS = [
	{ label: __("Self-hosted", "rkv-editor-components"), value: "self-hosted" },
	{ label: __("YouTube", "rkv-editor-components"), value: "youtube" },
];

/**
 * A button that opens the media library for a file, with a button to clear it.
 */
const FilePicker = ({
	allowedTypes,
	id,
	isSet,
	selectLabel,
	replaceLabel,
	removeLabel,
	onSelect,
	onRemove,
}) => (
	<PanelRow>
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={allowedTypes}
				value={id}
				onSelect={onSelect}
				render={({ open }) => (
					<Button variant="secondary" onClick={open}>
						{isSet ? replaceLabel : selectLabel}
					</Button>
				)}
			/>
		</MediaUploadCheck>
		{isSet && (
			<Button variant="tertiary" isDestructive onClick={onRemove}>
				{removeLabel}
			</Button>
		)}
	</PanelRow>
);

/**
 * Inspector panels for choosing a block's media: an image, a self-hosted video
 * (with poster and captions), or a YouTube video, plus the playback settings.
 *
 * Renders `PanelBody` panels, so place it inside `InspectorControls`. It edits
 * a flat `media` object and reports changes as partial objects to merge into it.
 *
 * @param {Object}   props
 * @param {Object}   props.media             The stored media: `type` ("image" or "video"), `imageId`, `imageUrl`, `source` ("self-hosted" or "youtube"), `youtubeUrl`, `videoId`, `videoUrl`, `posterId`, `posterUrl`, `captionsId`, `captionsUrl`, `title`, `autoplay`, `muted`, `loop`, `controls`.
 * @param {Function} props.onChange          Called with a partial `media` object of the changed keys.
 * @param {boolean}  props.allowImageSource  Adds a media type toggle, and an image picker for the "image" type. Without it the control is video only.
 * @param {string}   props.panelPrefix       Prefix for the panel titles (e.g. "Desktop"), for telling several instances in one block apart.
 * @param {boolean}  props.backgroundVideo   Limits video to a self-hosted background that plays muted and looping: the source, title, captions, and playback panels are hidden, for the block to force those values itself.
 */
const MediaSourceControl = ({
	media,
	onChange,
	allowImageSource = false,
	panelPrefix = "",
	backgroundVideo = false,
}) => {
	const {
		type,
		source,
		youtubeUrl,
		imageId,
		videoId,
		posterId,
		captionsId,
		captionsUrl,
		title,
		autoplay,
		muted,
		loop,
		controls,
	} = media;

	// Without `allowImageSource` there's no image option, so it's always video;
	// with it, an unset type is an image.
	const effectiveType = allowImageSource ? type || "image" : "video";
	const effectiveSource = backgroundVideo
		? "self-hosted"
		: source || "self-hosted";

	const panelTitle = (label) =>
		panelPrefix
			? sprintf(
					/* translators: 1: panel prefix, such as "Desktop". 2: panel title. */
					__("%1$s %2$s", "rkv-editor-components"),
					panelPrefix,
					label,
				)
			: label;

	const onChangeAutoplay = (value) => {
		// Autoplaying video has to be muted: browsers block it otherwise, and it's
		// an accessibility problem.
		onChange({ autoplay: value, muted: value ? true : muted });
	};

	if ("image" === effectiveType) {
		return (
			<>
				<MediaTypePanel
					show={allowImageSource}
					title={panelTitle(__("Media type", "rkv-editor-components"))}
					value={effectiveType}
					onChange={onChange}
				/>
				<PanelBody title={panelTitle(__("Image", "rkv-editor-components"))}>
					<FilePicker
						allowedTypes={["image"]}
						id={imageId}
						isSet={!!imageId}
						selectLabel={__("Select image", "rkv-editor-components")}
						replaceLabel={__("Replace image", "rkv-editor-components")}
						removeLabel={__("Remove image", "rkv-editor-components")}
						onSelect={(file) =>
							onChange({ imageId: file.id, imageUrl: file.url })
						}
						onRemove={() => onChange({ imageId: 0, imageUrl: "" })}
					/>
				</PanelBody>
			</>
		);
	}

	return (
		<>
			<MediaTypePanel
				show={allowImageSource}
				title={panelTitle(__("Media type", "rkv-editor-components"))}
				value={effectiveType}
				onChange={onChange}
			/>

			{!backgroundVideo && (
				<PanelBody title={panelTitle(__("Video source", "rkv-editor-components"))}>
					<RadioControl
						label={__("Source", "rkv-editor-components")}
						selected={effectiveSource}
						options={VIDEO_SOURCE_OPTIONS}
						onChange={(value) => onChange({ source: value })}
					/>
				</PanelBody>
			)}

			<PanelBody title={panelTitle(__("Video details", "rkv-editor-components"))}>
				{backgroundVideo ? (
					<p className="components-base-control__help">
						{__(
							"Plays as a muted, looping background video.",
							"rkv-editor-components",
						)}
					</p>
				) : (
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={__("Title", "rkv-editor-components")}
						help={__(
							"The accessible name for the video.",
							"rkv-editor-components",
						)}
						value={title || ""}
						onChange={(value) => onChange({ title: value })}
					/>
				)}

				{"youtube" === effectiveSource ? (
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={__("YouTube URL", "rkv-editor-components")}
						help={__(
							"Paste a YouTube watch, share, or embed URL.",
							"rkv-editor-components",
						)}
						value={youtubeUrl || ""}
						onChange={(value) => onChange({ youtubeUrl: value })}
					/>
				) : (
					<>
						<FilePicker
							allowedTypes={["video"]}
							id={videoId}
							isSet={!!videoId}
							selectLabel={__("Select video", "rkv-editor-components")}
							replaceLabel={__("Replace video", "rkv-editor-components")}
							removeLabel={__("Remove video", "rkv-editor-components")}
							onSelect={(file) =>
								onChange({ videoId: file.id, videoUrl: file.url })
							}
							onRemove={() => onChange({ videoId: 0, videoUrl: "" })}
						/>

						{!backgroundVideo && (
							<>
								<FilePicker
									allowedTypes={["text/vtt"]}
									id={captionsId}
									isSet={!!captionsUrl}
									selectLabel={__("Select captions (.vtt)", "rkv-editor-components")}
									replaceLabel={__("Replace captions (.vtt)", "rkv-editor-components")}
									removeLabel={__("Remove captions", "rkv-editor-components")}
									onSelect={(file) =>
										onChange({ captionsId: file.id, captionsUrl: file.url })
									}
									onRemove={() => onChange({ captionsId: 0, captionsUrl: "" })}
								/>

								{!captionsUrl && (
									<Notice status="warning" isDismissible={false}>
										{__(
											"No captions file added. Add a WebVTT (.vtt) captions file so this video is accessible to Deaf and hard-of-hearing users.",
											"rkv-editor-components",
										)}
									</Notice>
								)}
							</>
						)}
					</>
				)}

				<FilePicker
					allowedTypes={["image"]}
					id={posterId}
					isSet={!!posterId}
					selectLabel={__("Select poster image", "rkv-editor-components")}
					replaceLabel={__("Replace poster image", "rkv-editor-components")}
					removeLabel={__("Remove poster image", "rkv-editor-components")}
					onSelect={(file) =>
						onChange({ posterId: file.id, posterUrl: file.url })
					}
					onRemove={() => onChange({ posterId: 0, posterUrl: "" })}
				/>
				{"self-hosted" === effectiveSource && !posterId && (
					<p className="components-base-control__help">
						{__(
							"Optional. Without a poster image, nothing shows behind the video until it loads.",
							"rkv-editor-components",
						)}
					</p>
				)}
			</PanelBody>

			{!backgroundVideo && (
				<PanelBody title={panelTitle(__("Playback settings", "rkv-editor-components"))}>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Autoplay", "rkv-editor-components")}
						checked={!!autoplay}
						onChange={onChangeAutoplay}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Muted", "rkv-editor-components")}
						checked={!!muted}
						disabled={!!autoplay}
						help={
							autoplay
								? __("Autoplaying videos must be muted.", "rkv-editor-components")
								: undefined
						}
						onChange={(value) => onChange({ muted: value })}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Loop", "rkv-editor-components")}
						checked={!!loop}
						onChange={(value) => onChange({ loop: value })}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Show player controls", "rkv-editor-components")}
						checked={!!controls}
						onChange={(value) => onChange({ controls: value })}
					/>
					{autoplay && !muted && (
						<Notice status="warning" isDismissible={false}>
							{__(
								"Autoplaying, unmuted video is disruptive and an accessibility issue. Turn on Muted.",
								"rkv-editor-components",
							)}
						</Notice>
					)}
				</PanelBody>
			)}
		</>
	);
};

const MediaTypePanel = ({ show, title, value, onChange }) =>
	show ? (
		<PanelBody title={title}>
			<RadioControl
				label={__("Type", "rkv-editor-components")}
				selected={value}
				options={MEDIA_TYPE_OPTIONS}
				onChange={(type) => onChange({ type })}
			/>
		</PanelBody>
	) : null;

export default MediaSourceControl;
