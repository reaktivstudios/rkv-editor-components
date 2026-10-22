const BUILT_IN = {
	1: "0",
	2: "0.00",
	3: "#,##0",
	4: "#,##0.00",
	9: "0%",
	10: "0.00%",
	11: "0.00E+00",
	14: "m/d/yyyy",
	15: "d-mmm-yy",
	16: "d-mmm",
	17: "mmm-yy",
	18: "h:mm AM/PM",
	19: "h:mm:ss AM/PM",
	20: "h:mm",
	21: "h:mm:ss",
	22: "m/d/yyyy h:mm",
	37: "#,##0 ;(#,##0)",
	38: "#,##0 ;(#,##0)",
	39: "#,##0.00;(#,##0.00)",
	40: "#,##0.00;(#,##0.00)",
	41: "#,##0 ;(#,##0)",
	42: "$#,##0 ;($#,##0)",
	43: "#,##0.00 ;(#,##0.00)",
	44: "$#,##0.00 ;($#,##0.00)",
	45: "mm:ss",
	48: "##0.0E+0",
};
// Locale-specific date ids (CJK etc.) fall back to ISO-style.
[
	27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 50, 51, 52, 53, 54, 55, 56, 57, 58,
].forEach((id) => (BUILT_IN[id] = "yyyy-mm-dd"));

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/**
 * Resolve a number format id to its format code.
 *
 * @param {number}              id     numFmtId from styles.xml.
 * @param {Map<number, string>} custom Custom codes declared in the workbook.
 * @return {string} Format code.
 */
export function formatCodeFor(id, custom) {
	return custom.get(id) ?? BUILT_IN[id] ?? "General";
}

/**
 * Render a numeric cell the way Excel displays it.
 *
 * Covers decimals, thousands separators, percent, currency/literal text,
 * scientific notation and dates. Fractions and elapsed-time formats fall back
 * to the General rendering.
 *
 * @param {number}  value    Stored value.
 * @param {string}  code     Excel format code.
 * @param {boolean} date1904 Whether the workbook uses the 1904 date system.
 * @return {string} Display text.
 */
export function formatNumber(value, code, date1904 = false) {
	if (!code || /^general$/i.test(code) || code === "@") {
		return general(value);
	}

	const sections = splitSections(code);
	let section = sections[0];
	let v = value;
	let signed = true;
	if (sections.length > 1) {
		if (value < 0) {
			section = sections[1];
			v = -value;
			signed = false;
		} else if (value === 0 && sections.length > 2) {
			section = sections[2];
		}
	}

	const tokens = tokenize(section);
	if (tokens.some((t) => t.elapsed)) {
		return general(value);
	}

	const isDate = tokens.some((t) => !t.lit && /[ymdhs]/i.test(t.v));
	const text = isDate
		? formatDate(v, tokens, date1904)
		: formatDecimal(v, tokens, signed);
	return text === null ? general(value) : text.trim();
}

function general(value) {
	return String(Number(value.toPrecision(15)));
}

function splitSections(code) {
	const sections = [];
	let current = "";
	let quoted = false;
	let bracket = false;
	for (let i = 0; i < code.length; i++) {
		const ch = code[i];
		if (ch === "\\" && !quoted) {
			current += ch + (code[++i] ?? "");
			continue;
		}
		if (ch === '"') {
			quoted = !quoted;
		} else if (!quoted && ch === "[") {
			bracket = true;
		} else if (!quoted && ch === "]") {
			bracket = false;
		} else if (!quoted && !bracket && ch === ";") {
			sections.push(current);
			current = "";
			continue;
		}
		current += ch;
	}
	sections.push(current);
	return sections;
}

// Literal tokens ({ lit: true }) are emitted verbatim; the rest are format characters.
function tokenize(section) {
	const tokens = [];
	for (let i = 0; i < section.length; i++) {
		const ch = section[i];
		if (ch === '"') {
			const end = section.indexOf('"', i + 1);
			const stop = end < 0 ? section.length : end;
			tokens.push({ lit: true, v: section.slice(i + 1, stop) });
			i = stop;
		} else if (ch === "\\") {
			tokens.push({ lit: true, v: section[i + 1] ?? "" });
			i++;
		} else if (ch === "_") {
			tokens.push({ lit: true, v: " " });
			i++;
		} else if (ch === "*") {
			i++;
		} else if (ch === "[") {
			const end = section.indexOf("]", i);
			const stop = end < 0 ? section.length : end;
			const inner = section.slice(i + 1, stop);
			i = stop;
			const currency = inner.match(/^\$([^-]*)/);
			if (currency) {
				tokens.push({ lit: true, v: currency[1] });
			} else if (/^(h+|m+|s+)$/i.test(inner)) {
				tokens.push({ elapsed: true });
			}
		} else {
			tokens.push({ lit: false, v: ch });
		}
	}
	return tokens;
}

function roundTo(n, decimals) {
	const s = String(n);
	if (s.includes("e")) {
		return n.toFixed(decimals);
	}
	return Number(
		Math.round(Number(`${s}e${decimals}`)) + `e-${decimals}`,
	).toFixed(decimals);
}

function formatDecimal(value, tokens, signed) {
	const isPlaceholder = (t) => t && !t.lit && /[#0?.,]/.test(t.v);
	const start = tokens.findIndex(isPlaceholder);
	const percents = tokens.filter((t) => !t.lit && t.v === "%").length;

	if (start < 0) {
		return tokens.map((t) => t.v).join("");
	}
	let end = start;
	while (isPlaceholder(tokens[end])) {
		end++;
	}
	let exp = null;
	const marker = tokens[end];
	const sign = tokens[end + 1];
	const isExponent =
		marker &&
		!marker.lit &&
		/e/i.test(marker.v) &&
		sign &&
		!sign.lit &&
		/[+-]/.test(sign.v);
	// Fractions ("# ?/?") aren't supported; fall back to General.
	if (
		!isExponent &&
		tokens.some((t) => !t.lit && t.v === "/") &&
		tokens.some((t) => !t.lit && t.v.includes("?"))
	) {
		return null;
	}
	let run = tokens
		.slice(start, end)
		.map((t) => t.v)
		.join("");

	if (isExponent) {
		let digits = 0;
		let j = end + 2;
		while (tokens[j] && !tokens[j].lit && /[0#?]/.test(tokens[j].v)) {
			digits++;
			j++;
		}
		exp = { plus: sign.v === "+", digits };
		end = j;
	}

	let scale = 0;
	const trailing = run.match(/,+$/);
	if (trailing) {
		scale = trailing[0].length;
		run = run.slice(0, -scale);
	}
	const [intPat, decPat = ""] = run.split(".");
	const thousands = intPat.includes(",");
	const minInt = (intPat.match(/0/g) || []).length;
	const decimals = decPat.replace(/,/g, "").length;
	const optional = (decPat.match(/[#?]+$/) || [""])[0].length;

	const number = (value * 100 ** percents) / 1000 ** scale;
	const abs = Math.abs(number);
	let body;

	if (exp) {
		let e = abs === 0 ? 0 : Math.floor(Math.log10(abs));
		let m = abs / 10 ** e;
		if (Number(roundTo(m, decimals)) >= 10) {
			m /= 10;
			e++;
		}
		let expSign = exp.plus ? "+" : "";
		if (e < 0) {
			expSign = "-";
		}
		body =
			trimOptional(roundTo(m, decimals), optional) +
			"E" +
			expSign +
			String(Math.abs(e)).padStart(exp.digits, "0");
	} else {
		let [int, frac = ""] = trimOptional(roundTo(abs, decimals), optional).split(
			".",
		);
		if (minInt === 0 && int === "0") {
			int = "";
		}
		int = int.padStart(minInt, "0");
		if (thousands) {
			int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
		body = int + (frac ? `.${frac}` : "");
	}

	const negative = signed && number < 0 && /[1-9]/.test(body);
	const before = tokens
		.slice(0, start)
		.map((t) => t.v)
		.join("");
	const after = tokens
		.slice(end)
		.map((t) => t.v)
		.join("");
	return (negative ? "-" : "") + before + body + after;
}

// Drop up to `optional` trailing zero decimals (the `#`/`?` placeholders).
function trimOptional(fixed, optional) {
	if (!fixed.includes(".") || !optional) {
		return fixed;
	}
	let [int, frac] = fixed.split(".");
	let removable = optional;
	while (removable-- > 0 && frac.endsWith("0")) {
		frac = frac.slice(0, -1);
	}
	return frac ? `${int}.${frac}` : int;
}

function formatDate(value, tokens, date1904) {
	const epoch = date1904
		? Date.UTC(1904, 0, 1)
		: Date.UTC(1899, 11, value < 60 ? 31 : 30);
	// Group runs of date letters and AM/PM markers into items.
	const items = [];
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (t.lit) {
			items.push({ out: t.v });
			continue;
		}
		const rest = tokens
			.slice(i, i + 5)
			.map((x) => (x.lit ? "\0" : x.v))
			.join("");
		const ampm = rest.match(/^(am\/pm|a\/p)/i);
		if (ampm) {
			items.push({ ampm: ampm[0] });
			i += ampm[0].length - 1;
		} else if (/[ymdhs]/i.test(t.v)) {
			const unit = t.v.toLowerCase();
			let len = 1;
			while (
				tokens[i + len] &&
				!tokens[i + len].lit &&
				tokens[i + len].v.toLowerCase() === unit
			) {
				len++;
			}
			items.push({ unit, len });
			i += len - 1;
		} else if (
			t.v === "." &&
			items[items.length - 1]?.unit === "s" &&
			tokens[i + 1]?.v === "0"
		) {
			let len = 0;
			while (tokens[i + 1 + len]?.v === "0") {
				len++;
			}
			items.push({ frac: len });
			i += len;
		} else {
			items.push({ out: t.v });
		}
	}

	// Round to the finest fraction of a second the format shows.
	const step =
		1000 / 10 ** Math.min(3, Math.max(0, ...items.map((x) => x.frac ?? 0)));
	const date = new Date(Math.round((epoch + value * 86400000) / step) * step);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const units = items.filter((x) => x.unit);
	const hasAmPm = items.some((x) => x.ampm);
	const pad = (n, len) => String(n).padStart(len, "0");

	return items
		.map((item) => {
			if (item.out !== undefined) {
				return item.out;
			}
			if (item.ampm) {
				const pm = date.getUTCHours() >= 12;
				const word = (pm ? "PM" : "AM").slice(
					0,
					item.ampm.length === 5 ? 2 : 1,
				);
				return item.ampm === item.ampm.toLowerCase()
					? word.toLowerCase()
					: word;
			}
			if (item.frac) {
				return `.${pad(date.getUTCMilliseconds(), 3).slice(0, item.frac)}`;
			}
			const { unit, len } = item;
			if (unit === "y") {
				return len <= 2
					? pad(date.getUTCFullYear() % 100, 2)
					: pad(date.getUTCFullYear(), 4);
			}
			if (unit === "d") {
				if (len >= 3) {
					const day = DAYS[date.getUTCDay()];
					return len === 3 ? day.slice(0, 3) : day;
				}
				return len === 2 ? pad(date.getUTCDate(), 2) : date.getUTCDate();
			}
			if (unit === "h") {
				const h = hasAmPm ? date.getUTCHours() % 12 || 12 : date.getUTCHours();
				return len >= 2 ? pad(h, 2) : String(h);
			}
			if (unit === "s") {
				return len >= 2
					? pad(date.getUTCSeconds(), 2)
					: String(date.getUTCSeconds());
			}
			// "m" is a minute after hours or before seconds, otherwise a month.
			const at = units.indexOf(item);
			if (units[at - 1]?.unit === "h" || units[at + 1]?.unit === "s") {
				return len >= 2
					? pad(date.getUTCMinutes(), 2)
					: String(date.getUTCMinutes());
			}
			const month = MONTHS[date.getUTCMonth()];
			if (len >= 5) {
				return month[0];
			}
			if (len === 4) {
				return month;
			}
			if (len === 3) {
				return month.slice(0, 3);
			}
			return len === 2
				? pad(date.getUTCMonth() + 1, 2)
				: String(date.getUTCMonth() + 1);
		})
		.join("");
}
