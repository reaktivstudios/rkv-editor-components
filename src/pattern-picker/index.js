/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
import { useSelect, useDispatch } from "@wordpress/data";
import {
	ToolbarButton,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from "@wordpress/components";
import {
	BlockControls,
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from "@wordpress/block-editor";

/**
 * Internal dependencies
 */
import "./editor.scss";

/**
 * Returns the patterns registered for a block's type that can be inserted inside it.
 *
 * Matches patterns whose `Block Types` header includes the block's name. Patterns
 * flagged `Inserter: no` are already excluded by the underlying selector.
 *
 * @param {string} clientId Client ID of the block to find patterns for.
 * @return {Array} Matching block patterns (each with parsed `blocks`).
 */
export const usePatternsForBlock = (clientId) =>
	useSelect(
		(select) => {
			const { getBlockName, getPatternsByBlockTypes } =
				select(blockEditorStore);
			const blockName = getBlockName(clientId);

			return blockName ? getPatternsByBlockTypes(blockName, clientId) : [];
		},
		[clientId],
	);

/**
 * Block toolbar control that replaces a block's inner blocks with one of the
 * patterns registered for that block type.
 *
 * Renders nothing when no patterns target the block. Must be rendered inside the
 * block's `edit` function, since it fills the block toolbar.
 *
 * @param {Object} props
 * @param {string} props.clientId     Client ID of the block to populate.
 * @param {string} props.chooseLabel  Toolbar button text while the block has no inner blocks.
 * @param {string} props.changeLabel  Toolbar button text once the block has inner blocks.
 */
const PatternPicker = ({ clientId, chooseLabel, changeLabel }) => {
	const patterns = usePatternsForBlock(clientId);

	const hasInnerBlocks = useSelect(
		(select) => select(blockEditorStore).getBlockCount(clientId) > 0,
		[clientId],
	);

	const { replaceInnerBlocks } = useDispatch(blockEditorStore);

	if (!patterns.length) {
		return null;
	}

	const buttonLabel = hasInnerBlocks
		? changeLabel || __("Change design", "rkv-editor-components")
		: chooseLabel || __("Choose pattern", "rkv-editor-components");

	return (
		<BlockControls group="other">
			<Dropdown
				popoverProps={{ placement: "bottom-start" }}
				contentClassName="rkv-pattern-picker__popover"
				focusOnMount="firstElement"
				expandOnMobile
				renderToggle={({ isOpen, onToggle }) => (
					<ToolbarButton
						aria-haspopup="true"
						aria-expanded={isOpen}
						onClick={onToggle}
					>
						{buttonLabel}
					</ToolbarButton>
				)}
				renderContent={({ onClose }) => (
					<DropdownContentWrapper paddingSize="medium">
						<div className="rkv-pattern-picker__list">
							<BlockPatternsList
								blockPatterns={patterns}
								onClickPattern={(pattern, blocks) => {
									replaceInnerBlocks(clientId, blocks, false);
									onClose();
								}}
								showTitlesAsTooltip
							/>
						</div>
					</DropdownContentWrapper>
				)}
			/>
		</BlockControls>
	);
};

export default PatternPicker;
