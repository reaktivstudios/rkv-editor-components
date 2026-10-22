/**
 * Parse CSV/TSV text into a rectangular array of rows.
 *
 * Tab is used when the first line contains one (pasted from a spreadsheet),
 * otherwise comma. Supports quoted fields with escaped quotes and newlines.
 *
 * @param {string} text Raw delimited text.
 * @return {string[][]} Rows of equal length.
 */
export function parseDelimited(text) {
	const input = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
	if (!input) {
		return [];
	}

	const firstLine = input.split("\n", 1)[0];
	const delimiter = firstLine.includes("\t") ? "\t" : ",";
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (quoted) {
			if (char === '"' && input[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (char === '"') {
				quoted = false;
			} else {
				cell += char;
			}
		} else if (char === '"' && cell === "") {
			quoted = true;
		} else if (char === delimiter) {
			row.push(cell);
			cell = "";
		} else if (char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else {
			cell += char;
		}
	}
	row.push(cell);
	rows.push(row);

	return normalize(rows);
}

/**
 * Pad every row to the widest row's length.
 *
 * @param {string[][]} rows Ragged rows.
 * @return {string[][]} Rectangular rows.
 */
export function normalize(rows) {
	const width = Math.max(1, ...rows.map((r) => r.length));
	return rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
}
