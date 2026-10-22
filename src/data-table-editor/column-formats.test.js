/**
 * Internal dependencies
 */
import { DEFAULT_DATA_COLUMN_FORMATS, detectDataColumnFormats } from "./column-formats.js";

describe("detectDataColumnFormats", () => {
	const rows = [
		["Name", "Share", "Price", "Year", "Count", "Notes"],
		["A", "12%", "$5.00", "2024", "1,200", "hello"],
		["B", "8.5%", "$10", "2025", "300", ""],
	];

	it("guesses a format per column and keeps the first column as text", () => {
		expect(detectDataColumnFormats(rows)).toEqual([
			"text",
			"percent",
			"usd",
			"year",
			"number",
			"text",
		]);
	});

	it("falls back to text for formats that aren't offered", () => {
		const { text, number } = DEFAULT_DATA_COLUMN_FORMATS;
		expect(detectDataColumnFormats(rows, { text, number })).toEqual([
			"text",
			"text",
			"text",
			"text",
			"number",
			"text",
		]);
	});
});
