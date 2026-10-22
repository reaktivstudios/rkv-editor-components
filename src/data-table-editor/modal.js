/**
 * WordPress dependencies.
 */
import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import {
	Button,
	Modal,
	__experimentalConfirmDialog as ConfirmDialog,
} from "@wordpress/components";

/**
 * Internal dependencies.
 */
import DataTableEditor from "./index.js";

/**
 * A `DataTableEditor` in a full-size modal. Edits stay in the modal until
 * Apply; Cancel (or closing) asks before discarding them.
 *
 * @param {Object}     props
 * @param {string[][]} props.data     Header row followed by data rows.
 * @param {string}     props.title    Modal title.
 * @param {Function}   props.onSave   Called with `(rows, columnFormats)` on Apply.
 * @param {Function}   props.onClose  Called on cancel, after confirming if there are unapplied edits.
 */
export default function DataTableEditorModal({
	title,
	onSave,
	onClose,
	readOnly = false,
	...editorProps
}) {
	const [current, setCurrent] = useState(null);
	const [confirmingClose, setConfirmingClose] = useState(false);

	// Closing drops every unapplied edit, so ask first.
	const requestClose = () => (current ? setConfirmingClose(true) : onClose());

	return (
		<Modal
			title={
				title ??
				(readOnly
					? __("View data", "rkv-editor-components")
					: __("Edit data", "rkv-editor-components"))
			}
			onRequestClose={requestClose}
			size="fill"
			className="rkv-data-table-editor-modal"
			headerActions={
				<>
					<Button variant="tertiary" onClick={requestClose}>
						{__("Cancel", "rkv-editor-components")}
					</Button>
					<Button
						variant="primary"
						onClick={() =>
							onSave(
								...(current ?? [editorProps.data, editorProps.columnFormats]),
							)
						}
					>
						{__("Apply", "rkv-editor-components")}
					</Button>
				</>
			}
		>
			<DataTableEditor
				{...editorProps}
				readOnly={readOnly}
				onChange={(rows, columnFormats) => setCurrent([rows, columnFormats])}
			/>

			<ConfirmDialog
				isOpen={confirmingClose}
				confirmButtonText={__("Discard", "rkv-editor-components")}
				onConfirm={onClose}
				onCancel={() => setConfirmingClose(false)}
			>
				{__("Discard your changes to the table?", "rkv-editor-components")}
			</ConfirmDialog>
		</Modal>
	);
}
