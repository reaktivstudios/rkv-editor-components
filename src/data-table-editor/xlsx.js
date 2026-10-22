/**
 * Internal dependencies.
 */
import { normalize } from "./csv.js";
import { formatCodeFor, formatNumber } from "./numfmt.js";

/**
 * Read the first worksheet of an .xlsx file into rows of strings.
 *
 * An .xlsx is a zip of XML parts; entries are inflated with the browser's
 * native DecompressionStream so no spreadsheet library is needed. Cell values
 * are rendered as Excel displays them (number formats applied; formulas yield
 * their cached result).
 *
 * @param {ArrayBuffer} buffer File contents.
 * @return {Promise<string[][]>} Rows of equal length.
 */
export async function parseXlsx(buffer) {
	const entries = readZipEntries(buffer);
	const read = (name) => readEntry(buffer, entries, name);

	const workbook = await read("xl/workbook.xml");
	const rels = await read("xl/_rels/workbook.xml.rels");
	const sheet = workbook.querySelector("sheets > sheet");
	const relId = sheet?.getAttribute("r:id");
	const target = [...rels.querySelectorAll("Relationship")]
		.find((rel) => rel.getAttribute("Id") === relId)
		?.getAttribute("Target");
	if (!target) {
		throw new Error("No worksheet found");
	}
	const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

	const sharedStrings = entries.has("xl/sharedStrings.xml")
		? [...(await read("xl/sharedStrings.xml")).querySelectorAll("si")].map(
				(si) =>
					[...si.querySelectorAll("t")]
						.filter((t) => !t.closest("rPh"))
						.map((t) => t.textContent)
						.join(""),
			)
		: [];

	const formats = await readFormats(read, entries);
	formats.date1904 = ["1", "true"].includes(
		workbook.querySelector("workbookPr")?.getAttribute("date1904"),
	);

	const worksheet = await read(sheetPath);
	const rows = [];
	worksheet.querySelectorAll("sheetData > row").forEach((rowEl) => {
		const r = Number(rowEl.getAttribute("r")) - 1;
		rows[r] = rows[r] || [];
		rowEl.querySelectorAll("c").forEach((cell) => {
			const c = columnIndex(cell.getAttribute("r"));
			rows[r][c] = cellValue(cell, sharedStrings, formats);
		});
	});

	// Sparse rows/cells (gaps in the sheet) become empty strings.
	const dense = Array.from(rows, (row) =>
		Array.from(row || [], (v) => v ?? ""),
	);
	return dense.length ? normalize(dense) : [];
}

async function readFormats(read, entries) {
	const custom = new Map();
	const xfs = [];
	if (entries.has("xl/styles.xml")) {
		const styles = await read("xl/styles.xml");
		styles.querySelectorAll("numFmts > numFmt").forEach((fmt) => {
			custom.set(
				Number(fmt.getAttribute("numFmtId")),
				fmt.getAttribute("formatCode"),
			);
		});
		styles.querySelectorAll("cellXfs > xf").forEach((xf) => {
			xfs.push(Number(xf.getAttribute("numFmtId") || 0));
		});
	}
	return { custom, xfs };
}

function cellValue(cell, sharedStrings, formats) {
	const type = cell.getAttribute("t");
	if (type === "inlineStr") {
		return [...cell.querySelectorAll("t")].map((t) => t.textContent).join("");
	}
	const raw = cell.querySelector("v")?.textContent ?? "";
	if (type === "s") {
		return sharedStrings[Number(raw)] ?? "";
	}
	if (type === "b") {
		return raw === "1" ? "TRUE" : "FALSE";
	}
	if (!type || type === "n") {
		const number = Number(raw);
		if (raw === "" || !Number.isFinite(number)) {
			return raw;
		}
		const id = formats.xfs[Number(cell.getAttribute("s") || 0)] ?? 0;
		return formatNumber(
			number,
			formatCodeFor(id, formats.custom),
			formats.date1904,
		);
	}
	return raw;
}

// "AB12" -> 27 (zero-based column).
function columnIndex(ref) {
	const letters = ref.match(/^[A-Z]+/)[0];
	return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

function readZipEntries(buffer) {
	const view = new DataView(buffer);
	let eocd = buffer.byteLength - 22;
	while (eocd >= 0 && view.getUint32(eocd, true) !== 0x06054b50) {
		eocd--;
	}
	if (eocd < 0) {
		throw new Error("Not a valid .xlsx file");
	}

	const count = view.getUint16(eocd + 10, true);
	let offset = view.getUint32(eocd + 16, true);
	const decoder = new TextDecoder();
	const entries = new Map();

	for (let i = 0; i < count; i++) {
		const nameLength = view.getUint16(offset + 28, true);
		const extraLength = view.getUint16(offset + 30, true);
		const commentLength = view.getUint16(offset + 32, true);
		const name = decoder.decode(
			new Uint8Array(buffer, offset + 46, nameLength),
		);
		entries.set(name, {
			method: view.getUint16(offset + 10, true),
			size: view.getUint32(offset + 20, true),
			localOffset: view.getUint32(offset + 42, true),
		});
		offset += 46 + nameLength + extraLength + commentLength;
	}
	return entries;
}

// Guards against zip bombs: a tiny file can inflate to gigabytes.
const MAX_INFLATED_BYTES = 50 * 1024 * 1024;

async function readLimited(stream) {
	const reader = stream.getReader();
	const chunks = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		total += value.length;
		if (total > MAX_INFLATED_BYTES) {
			await reader.cancel();
			throw new Error("Spreadsheet is too large");
		}
		chunks.push(value);
	}
	return new Uint8Array(await new Blob(chunks).arrayBuffer());
}

async function readEntry(buffer, entries, name) {
	const entry = entries.get(name);
	if (!entry) {
		throw new Error(`Missing ${name}`);
	}
	const view = new DataView(buffer);
	const start =
		entry.localOffset +
		30 +
		view.getUint16(entry.localOffset + 26, true) +
		view.getUint16(entry.localOffset + 28, true);
	const data = new Uint8Array(buffer, start, entry.size);

	let bytes = data;
	if (entry.method === 8) {
		const stream = new Blob([data])
			.stream()
			.pipeThrough(new DecompressionStream("deflate-raw"));
		bytes = await readLimited(stream);
	} else if (entry.method !== 0) {
		throw new Error("Unsupported compression");
	}

	return new window.DOMParser().parseFromString(
		new TextDecoder().decode(bytes),
		"application/xml",
	);
}
