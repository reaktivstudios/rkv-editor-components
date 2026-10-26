/**
 * WordPress dependencies
 */
import { useState } from "@wordpress/element";
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	InnerBlocks,
	RichText,
	WritingFlow,
	useBlockProps,
} from "@wordpress/block-editor";
import { createBlock, registerBlockType } from "@wordpress/blocks";

/**
 * Internal dependencies
 */
import PatternPicker from "./index.js";

const CONTAINER = "rkv-storybook/pattern-container";
const TEXT = "rkv-storybook/pattern-text";

// A block with an inner-block area, and a text block to fill it with.
if (!window.__rkvPatternPickerStory) {
	window.__rkvPatternPickerStory = true;

	registerBlockType(CONTAINER, {
		title: "Pattern container",
		category: "design",
		supports: { html: false },
		edit: ({ clientId }) => (
			<div
				{...useBlockProps({
					style: { padding: 16, border: "1px dashed #949494" },
				})}
			>
				<PatternPicker clientId={clientId} />
				<InnerBlocks />
			</div>
		),
		save: () => <InnerBlocks.Content />,
	});

	registerBlockType(TEXT, {
		title: "Pattern text",
		category: "text",
		attributes: { content: { type: "string", default: "" } },
		edit: ({ attributes, setAttributes }) => (
			<RichText
				{...useBlockProps()}
				tagName="p"
				value={attributes.content}
				onChange={(content) => setAttributes({ content })}
			/>
		),
		save: () => null,
	});
}

const textMarkup = (content) =>
	`<!-- wp:${TEXT} ${JSON.stringify({ content })} /-->`;

const PATTERNS = [
	{
		name: "rkv-storybook/intro",
		title: "Intro",
		blockTypes: [CONTAINER],
		content: textMarkup("A short introduction paragraph."),
	},
	{
		name: "rkv-storybook/two-paragraphs",
		title: "Two paragraphs",
		blockTypes: [CONTAINER],
		content:
			textMarkup("First paragraph.") + textMarkup("Second paragraph."),
	},
];

const Playground = ({ patterns, withContent }) => {
	const [blocks, setBlocks] = useState(() => [
		createBlock(
			CONTAINER,
			{},
			withContent ? [createBlock(TEXT, { content: "Existing content" })] : [],
		),
	]);

	return (
		<BlockEditorProvider
			value={blocks}
			onInput={setBlocks}
			onChange={setBlocks}
			settings={{ __experimentalBlockPatterns: patterns }}
		>
			<p>Select the container block, then use its toolbar.</p>
			<BlockTools>
				<WritingFlow>
					<BlockList />
				</WritingFlow>
			</BlockTools>
		</BlockEditorProvider>
	);
};

export default {
	title: "Components/PatternPicker",
	component: PatternPicker,
	parameters: {
		docs: {
			source: {
				code: `import { InnerBlocks, useBlockProps } from "@wordpress/block-editor";
import { PatternPicker } from "@reaktiv/editor-components";

const Edit = ({ clientId }) => (
	<div {...useBlockProps()}>
		<PatternPicker clientId={clientId} />
		<InnerBlocks />
	</div>
);`,
			},
		},
	},
	render: (args) => <Playground {...args} />,
	args: {
		patterns: PATTERNS,
		withContent: false,
	},
	argTypes: {
		clientId: { control: false },
		patterns: { control: false },
	},
};

export const Default = {};

export const ChangeDesign = {
	args: {
		withContent: true,
	},
};

export const NoPatterns = {
	args: {
		patterns: [],
	},
};
