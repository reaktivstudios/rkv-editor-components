/**
 * Internal dependencies
 */
import { normalize, parseDelimited } from "./csv.js";

describe("parseDelimited", () => {
	it("parses comma-separated rows", () => {
		expect(parseDelimited("a,b\n1,2")).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("uses tabs when the first line has one", () => {
		expect(parseDelimited("a\tb,c\n1\t2")).toEqual([
			["a", "b,c"],
			["1", "2"],
		]);
	});

	it("handles quoted fields with commas, quotes and newlines", () => {
		expect(parseDelimited('a,b\n"x,1","say ""hi""\nthere"')).toEqual([
			["a", "b"],
			["x,1", 'say "hi"\nthere'],
		]);
	});

	it("returns no rows for empty text and pads ragged rows", () => {
		expect(parseDelimited("")).toEqual([]);
		expect(parseDelimited("a,b,c\n1")).toEqual([
			["a", "b", "c"],
			["1", "", ""],
		]);
	});
});

describe("normalize", () => {
	it("pads to the widest row", () => {
		expect(normalize([["a"], ["b", "c"]])).toEqual([
			["a", ""],
			["b", "c"],
		]);
	});
});
