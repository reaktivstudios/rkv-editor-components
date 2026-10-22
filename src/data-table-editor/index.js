/**
 * WordPress dependencies.
 */
import { __ } from "@wordpress/i18n";
import { createUndoManager } from "@wordpress/undo-manager";
import {
	undo as undoIcon,
	redo as redoIcon,
	upload as uploadIcon,
	chevronLeft,
	chevronRight,
} from "@wordpress/icons";
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "@wordpress/element";
import {
	Button,
	Dropdown,
	Notice,
	TextareaControl,
	__experimentalConfirmDialog as ConfirmDialog,
} from "@wordpress/components";

/**
 * External dependencies.
 */
import classnames from "classnames";

/**
 * Internal dependencies.
 */
import FormatPill from "../format-pill/index.js";
import {
	DEFAULT_DATA_COLUMN_FORMAT,
	DEFAULT_DATA_COLUMN_FORMATS,
	detectDataColumnFormats,
} from "./column-formats.js";
import { normalize, parseDelimited } from "./csv.js";
import { clipboardPaste } from "./icons.js";
import { parseXlsx } from "./xlsx.js";
import "./editor.scss";

/**
 * A spreadsheet-style editor for a table of text: type or paste cells, add,
 * remove and reorder rows and columns, import a CSV or .xlsx file, and undo
 * and redo. The first row is the header row. Each column can carry a format.
 *
 * It keeps its own state, starting from `data`, and reports every change
 * through `onChange`. To edit in a modal, use `DataTableEditorModal`.
 *
 * @param {Object}     props
 * @param {string[][]} props.data           Header row followed by data rows. Read once, when the editor mounts.
 * @param {string[]}   props.columnFormats  Format slug per column. Read once, when the editor mounts.
 * @param {Object}     props.formats        Available formats keyed by slug: { label, preview }.
 * @param {boolean}    props.readOnly       Locks the cells; column formats can still change.
 * @param {string}     props.readOnlyNotice Notice shown above the table when `readOnly`.
 * @param {Function}   props.onChange       Called with `(rows, columnFormats)` after each change, including undo and redo.
 * @param {string}     props.className      Additional class name.
 */
export default function DataTableEditor({
	data,
	columnFormats = [],
	formats: formatOptions = DEFAULT_DATA_COLUMN_FORMATS,
	readOnly = false,
	readOnlyNotice = __(
		"These rows can’t be edited here. Column formats can.",
		"rkv-editor-components",
	),
	onChange,
	className,
}) {
	// Rows and column formats share one state so undo/redo keeps them aligned.
	const [table, setTable] = useState(() => ({
		rows: normalize(data),
		formats: columnFormats,
	}));
	const { rows, formats } = table;
	const [undoManager] = useState(createUndoManager);
	// Consecutive edits to the same cell are staged so they collapse into one undo step.
	const lastKey = useRef(null);

	const columnCount = rows[0].length;
	const formatAt = (i) => formats[i] ?? DEFAULT_DATA_COLUMN_FORMAT;

	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		onChange?.(
			rows,
			Array.from({ length: columnCount }, (_, i) => formatAt(i)),
		);
		// Only a new table is a change; `onChange` is usually a fresh closure each render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [table]);

	const setRows = (updater, key = null, nextFormats = formats) => {
		const next = typeof updater === "function" ? updater(rows) : updater;
		if (next === rows && nextFormats === formats) {
			return;
		}
		const to = { rows: next, formats: nextFormats };
		undoManager.addRecord(
			[{ id: "table", changes: { table: { from: table, to } } }],
			key !== null && key === lastKey.current,
		);
		lastKey.current = key;
		setTable(to);
	};

	const undo = () => {
		lastKey.current = null;
		const record = undoManager.undo();
		if (record) {
			setTable(record[0].changes.table.from);
		}
	};
	const redo = () => {
		lastKey.current = null;
		const record = undoManager.redo();
		if (record) {
			setTable(record[0].changes.table.to);
		}
	};

	const onKeyDown = (event) => {
		if (!(event.metaKey || event.ctrlKey) || event.altKey) {
			return;
		}
		const key = event.key.toLowerCase();
		if (key === "z") {
			event.preventDefault();
			if (event.shiftKey) {
				redo();
			} else {
				undo();
			}
		} else if (key === "y" && !event.metaKey) {
			event.preventDefault();
			redo();
		}
	};
	const [pending, setPending] = useState(null);
	const [importError, setImportError] = useState(null);
	const fileInput = useRef(null);

	const setCell = (r, c, value) =>
		setRows(
			(prev) =>
				prev.map((row, ri) =>
					ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row,
				),
			`cell-${r}-${c}`,
		);

	// Multi-cell pastes (from a spreadsheet) fill the grid from the focused cell.
	const onCellPaste = (event, r, c) => {
		if (readOnly) {
			return;
		}
		const text = event.clipboardData.getData("text");
		if (!/[\t\n]/.test(text.replace(/\n$/, ""))) {
			return;
		}
		event.preventDefault();
		const pasted = parseDelimited(text);
		setRows((prev) => {
			const next = prev.map((row) => [...row]);
			pasted.forEach((pastedRow, pr) => {
				while (next.length <= r + pr) {
					next.push(Array(columnCount).fill(""));
				}
				pastedRow.forEach((value, pc) => {
					next[r + pr][c + pc] = value;
				});
			});
			return normalize(next);
		});
	};

	const importText = (text, onDone) => {
		const parsed = parseDelimited(text);
		if (parsed.length) {
			setPending(parsed);
			onDone();
		}
	};

	const importFile = async (event) => {
		const file = event.target.files[0];
		event.target.value = "";
		if (!file) {
			return;
		}
		setImportError(null);
		try {
			const parsed = /\.xlsx$/i.test(file.name)
				? await parseXlsx(await file.arrayBuffer())
				: parseDelimited(await file.text());
			if (parsed.length) {
				setPending(parsed);
			} else {
				setImportError(__("The file is empty.", "rkv-editor-components"));
			}
		} catch {
			setImportError(__("Could not read that file.", "rkv-editor-components"));
		}
	};

	const addRow = () =>
		setRows((prev) => [...prev, Array(columnCount).fill("")]);
	const addColumn = () => setRows((prev) => prev.map((row) => [...row, ""]));
	const removeRow = (r) =>
		setRows((prev) =>
			prev.length > 1 ? prev.filter((_, i) => i !== r) : prev,
		);
	const removeColumn = (c) =>
		setRows(
			(prev) =>
				prev[0].length > 1
					? prev.map((row) => row.filter((_, i) => i !== c))
					: prev,
			null,
			columnCount > 1 ? formats.filter((_, i) => i !== c) : formats,
		);
	const tableRef = useRef(null);
	const pendingMove = useRef(null);

	const columnCells = (c) =>
		Array.from(tableRef.current.querySelectorAll("tr")).map(
			(tr) => tr.children[c + 1],
		);
	const columnLeft = (c) => columnCells(c)[0].getBoundingClientRect().left;

	const moveColumn = (c, dir) => {
		const t = c + dir;
		if (t < 0 || t >= columnCount) {
			return;
		}
		pendingMove.current = {
			c,
			t,
			dir,
			cLeft: columnLeft(c),
			tLeft: columnLeft(t),
		};
		const swap = (arr) => {
			const next = [...arr];
			[next[c], next[t]] = [next[t], next[c]];
			return next;
		};
		setRows(
			(prev) => prev.map(swap),
			null,
			swap(Array.from({ length: columnCount }, (_, i) => formatAt(i))),
		);
	};

	// FLIP: both columns start at their old positions and slide to the new ones together.
	useLayoutEffect(() => {
		const move = pendingMove.current;
		pendingMove.current = null;
		if (!move || !tableRef.current) {
			return;
		}
		const { c, t, dir, cLeft, tLeft } = move;
		// Keep focus on the moved column's arrow; fall back to the other arrow at an edge.
		const head = columnCells(t)[0];
		(
			head.querySelector(`[data-move="${dir < 0 ? "left" : "right"}"]`) ??
			head.querySelector("[data-move]")
		)?.focus();
		const options = { duration: 250, easing: "ease-in-out" };
		// Content now at c came from t, and vice versa.
		[
			[c, tLeft],
			[t, cLeft],
		].forEach(([index, oldLeft]) => {
			const dx = oldLeft - columnLeft(index);
			columnCells(index).forEach((cell) =>
				cell.animate(
					[
						{ transform: `translateX(${dx}px)` },
						{ transform: "translateX(0)" },
					],
					options,
				),
			);
		});
		// Re-measures only when the table changes; columnLeft is a fresh closure each render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [table]);

	const setFormat = (c, slug) =>
		setRows(
			rows,
			null,
			Array.from({ length: columnCount }, (_, i) =>
				i === c ? slug : formatAt(i),
			),
		);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={classnames("rkv-data-table-editor", className)}
			onKeyDown={onKeyDown}
		>
			<div className="rkv-data-table-editor__toolbar">
				{!readOnly && (
					<div className="rkv-data-table-editor__group">
						<Button variant="tertiary" size="compact" onClick={addRow}>
							{__("Add row", "rkv-editor-components")}
						</Button>
						<Button variant="tertiary" size="compact" onClick={addColumn}>
							{__("Add column", "rkv-editor-components")}
						</Button>
					</div>
				)}
				<div className="rkv-data-table-editor__group">
					<Button
						icon={undoIcon}
						label={__("Undo", "rkv-editor-components")}
						onClick={undo}
						disabled={!undoManager.hasUndo()}
						accessibleWhenDisabled
					/>
					<Button
						icon={redoIcon}
						label={__("Redo", "rkv-editor-components")}
						onClick={redo}
						disabled={!undoManager.hasRedo()}
						accessibleWhenDisabled
					/>
				</div>
				{!readOnly && (
					<div className="rkv-data-table-editor__group">
						<Button
							icon={uploadIcon}
							label={__("Import Excel or CSV file", "rkv-editor-components")}
							onClick={() => fileInput.current.click()}
						/>
						<input
							ref={fileInput}
							type="file"
							accept=".xlsx,.csv,.tsv,.txt"
							hidden
							onChange={importFile}
						/>
						<Dropdown
							popoverProps={{ placement: "bottom-end" }}
							renderToggle={({ isOpen, onToggle }) => (
								<Button
									icon={clipboardPaste}
									label={__("Paste CSV", "rkv-editor-components")}
									onClick={onToggle}
									aria-expanded={isOpen}
								/>
							)}
							renderContent={({ onClose: closePopover }) => (
								<div className="rkv-data-table-editor__paste">
									<TextareaControl
										__nextHasNoMarginBottom
										label={__(
											"Paste CSV or spreadsheet data",
											"rkv-editor-components",
										)}
										rows={6}
										value=""
										onChange={() => {}}
										onPaste={(e) => {
											e.preventDefault();
											importText(e.clipboardData.getData("text"), closePopover);
										}}
									/>
								</div>
							)}
						/>
					</div>
				)}
			</div>

			{readOnly && (
				<Notice status="info" isDismissible={false}>
					{readOnlyNotice}
				</Notice>
			)}
			{importError && (
				<Notice status="error" onRemove={() => setImportError(null)}>
					{importError}
				</Notice>
			)}

			<div className="rkv-data-table-editor__scroll">
				<table ref={tableRef} className="rkv-data-table-editor__table">
					<thead>
						<tr>
							<th />
							{rows[0].map((_, c) => (
								<th key={c}>
									<div className="rkv-data-table-editor__column-head">
										{!readOnly && (
											<Button
												isDestructive
												size="small"
												onClick={() => removeColumn(c)}
												disabled={columnCount < 2}
												label={__("Remove column", "rkv-editor-components")}
												showTooltip
											>
												×
											</Button>
										)}
										<span className="rkv-data-table-editor__column-move">
											{!readOnly && c > 0 && (
												<Button
													size="small"
													icon={chevronLeft}
													data-move="left"
													onClick={() => moveColumn(c, -1)}
													label={__(
														"Move column left",
														"rkv-editor-components",
													)}
													showTooltip
												/>
											)}
											{!readOnly && c < columnCount - 1 && (
												<Button
													size="small"
													icon={chevronRight}
													data-move="right"
													onClick={() => moveColumn(c, 1)}
													label={__(
														"Move column right",
														"rkv-editor-components",
													)}
													showTooltip
												/>
											)}
										</span>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, r) => (
							<tr key={r} className={r === 0 ? "is-header" : undefined}>
								<th>
									{!readOnly && (
										<Button
											isDestructive
											size="small"
											onClick={() => removeRow(r)}
											disabled={r === 0 || rows.length < 2}
											label={__("Remove row", "rkv-editor-components")}
											showTooltip
										>
											×
										</Button>
									)}
								</th>
								{row.map((cell, c) => (
									<td key={c} className={r === 0 ? "has-format" : undefined}>
										<input
											type="text"
											value={cell}
											readOnly={readOnly}
											aria-label={`${__("Row", "rkv-editor-components")} ${r + 1}, ${__("column", "rkv-editor-components")} ${c + 1}`}
											onChange={(e) => setCell(r, c, e.target.value)}
											onPaste={(e) => onCellPaste(e, r, c)}
										/>
										{r === 0 && (
											<FormatPill
												value={formatAt(c)}
												formats={formatOptions}
												defaultFormat={DEFAULT_DATA_COLUMN_FORMAT}
												onChange={(slug) => setFormat(c, slug)}
											/>
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<ConfirmDialog
				isOpen={!!pending}
				confirmButtonText={__("Replace", "rkv-editor-components")}
				onConfirm={() => {
					setRows(pending, null, detectDataColumnFormats(pending, formatOptions));
					setPending(null);
				}}
				onCancel={() => setPending(null)}
			>
				{__(
					"Replace the existing table contents with the imported data?",
					"rkv-editor-components",
				)}
			</ConfirmDialog>
		</div>
	);
}
