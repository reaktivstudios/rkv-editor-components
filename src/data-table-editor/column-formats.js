export const DEFAULT_DATA_COLUMN_FORMAT = "text";

/**
 * Column formats: how a column's values are displayed. The stored cell text
 * never changes. `label` and `preview` feed the format pill; any other keys are
 * yours to use when you display the values.
 */
export const DEFAULT_DATA_COLUMN_FORMATS = {
	text: { label: "Text", preview: "Text" },
	percent: { label: "Percentage", preview: "%" },
	number: { label: "Number", preview: "1,234" },
	usd: { label: "US Dollars", preview: "$" },
	year: { label: "Year", preview: String(new Date().getFullYear()) },
};

const PERCENT = /^-?[\d,]*\.?\d+\s*%$/;
const USD = /^-?\$[\d,]*\.?\d+$/;
const NUMBER = /^[-+]?\$?[\d,]*\.?\d+$/;
const YEAR = /^(1[0-9]|2[0-9])\d\d$/;

/**
 * Guess a format per column from imported rows (header row excluded).
 * The first column holds labels, so it stays plain text. Columns that look
 * like years get the Year format so "2024" doesn't become "2,024". Only formats
 * present in `formats` are chosen.
 *
 * @param {string[][]} rows    Header row followed by data rows.
 * @param {Object}     formats Available formats keyed by slug.
 * @return {string[]} One format slug per column.
 */
export function detectDataColumnFormats(rows, formats = DEFAULT_DATA_COLUMN_FORMATS) {
	const pick = (slug) => (slug in formats ? slug : DEFAULT_DATA_COLUMN_FORMAT);
	return (rows[0] ?? []).map((_, c) => {
		const values = rows
			.slice(1)
			.map((row) => String(row[c] ?? "").trim())
			.filter(Boolean);
		if (c === 0 || !values.length) {
			return DEFAULT_DATA_COLUMN_FORMAT;
		}
		if (values.every((v) => PERCENT.test(v))) {
			return pick("percent");
		}
		if (values.every((v) => USD.test(v))) {
			return pick("usd");
		}
		if (values.every((v) => YEAR.test(v))) {
			return pick("year");
		}
		if (values.every((v) => NUMBER.test(v))) {
			return pick("number");
		}
		return DEFAULT_DATA_COLUMN_FORMAT;
	});
}
