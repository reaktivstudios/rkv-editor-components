/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

/**
 * Internal dependencies
 */
import MediaSourceControl from "../media-source-control/index.js";

/**
 * The shape of one viewport's media, as `MediaSourceControl` edits it.
 */
export const DEFAULT_MEDIA = {
	type: "image",
	imageId: 0,
	imageUrl: "",
	source: "self-hosted",
	youtubeUrl: "",
	videoId: 0,
	videoUrl: "",
	posterId: 0,
	posterUrl: "",
	captionsId: 0,
	captionsUrl: "",
	title: "",
	autoplay: false,
	muted: false,
	loop: false,
	controls: true,
};

const EMPTY_MEDIA = {};

/**
 * Inspector panels for media that differs by viewport: the desktop media, plus
 * optional tablet and mobile media that otherwise fall back to the next larger
 * viewport.
 *
 * Renders `PanelBody` panels, so place it inside `InspectorControls`. A viewport
 * counts as overridden when its media has a `type`; turning an override on starts
 * it from `DEFAULT_MEDIA`, and turning it off resets it to `{}`.
 *
 * @param {Object}   props
 * @param {Object}   props.value           `{ desktop, tablet, mobile }`, each a `MediaSourceControl` media object.
 * @param {Function} props.onChange        Called with the whole next `{ desktop, tablet, mobile }` value.
 * @param {boolean}  props.backgroundVideo Passed to `MediaSourceControl`.
 */
const ViewportMediaControls = ({ value, onChange, backgroundVideo = false }) => {
	const {
		desktop = EMPTY_MEDIA,
		tablet = EMPTY_MEDIA,
		mobile = EMPTY_MEDIA,
	} = value;

	const hasTabletOverride = Boolean(tablet.type);
	const hasMobileOverride = Boolean(mobile.type);

	const update = (viewport, current) => (partial) =>
		onChange({ desktop, tablet, mobile, [viewport]: { ...current, ...partial } });

	const toggleOverride = (viewport) => (enabled) =>
		onChange({
			desktop,
			tablet,
			mobile,
			[viewport]: enabled ? { ...DEFAULT_MEDIA } : {},
		});

	return (
		<>
			<MediaSourceControl
				media={desktop}
				onChange={update("desktop", desktop)}
				allowImageSource
				backgroundVideo={backgroundVideo}
				panelPrefix={__("Desktop", "rkv-editor-components")}
			/>

			<PanelBody
				title={__("Tablet media", "rkv-editor-components")}
				initialOpen={false}
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={__("Use a different asset for tablet", "rkv-editor-components")}
					help={__(
						"When off, tablet viewports use the desktop asset.",
						"rkv-editor-components",
					)}
					checked={hasTabletOverride}
					onChange={toggleOverride("tablet")}
				/>
			</PanelBody>
			{hasTabletOverride && (
				<MediaSourceControl
					media={tablet}
					onChange={update("tablet", tablet)}
					allowImageSource
					backgroundVideo={backgroundVideo}
					panelPrefix={__("Tablet", "rkv-editor-components")}
				/>
			)}

			<PanelBody
				title={__("Mobile media", "rkv-editor-components")}
				initialOpen={false}
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={__("Use a different asset for mobile", "rkv-editor-components")}
					help={__(
						"When off, mobile viewports use the tablet asset, or the desktop asset if tablet isn't set either.",
						"rkv-editor-components",
					)}
					checked={hasMobileOverride}
					onChange={toggleOverride("mobile")}
				/>
			</PanelBody>
			{hasMobileOverride && (
				<MediaSourceControl
					media={mobile}
					onChange={update("mobile", mobile)}
					allowImageSource
					backgroundVideo={backgroundVideo}
					panelPrefix={__("Mobile", "rkv-editor-components")}
				/>
			)}
		</>
	);
};

export default ViewportMediaControls;
