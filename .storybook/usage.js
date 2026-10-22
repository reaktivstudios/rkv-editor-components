const PACKAGE = "@reaktiv/editor-components";

const indent = (text, depth) =>
	text
		.split("\n")
		.map((line) => (line ? "\t".repeat(depth) + line : line))
		.join("\n");

// Prints a value as JS source: unquoted keys, no JSON noise.
export const js = (value) => {
	if (Array.isArray(value)) {
		const items = value.map(js);
		return items.join(", ").length > 60 || items.some((i) => i.includes("\n"))
			? `[\n${indent(items.join(",\n"), 1)},\n]`
			: `[${items.join(", ")}]`;
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value).map(([k, v]) => `${k}: ${js(v)}`);
		return entries.join(", ").length > 60
			? `{\n${indent(entries.join(",\n"), 1)},\n}`
			: `{ ${entries.join(", ")} }`;
	}
	return JSON.stringify(value);
};

const attr = (key, value) => {
	if (value === true) return key;
	if (typeof value === "string") return `${key}=${JSON.stringify(value)}`;
	return `${key}={${js(value)}}`;
};

/**
 * Builds a story's docs snippet: the props come from the story's args, and
 * the state and handlers a consumer would write around them are hand-written.
 *
 * @param {Object}                    options
 * @param {string[]}                  options.imports   Package exports to import, the component first.
 * @param {string}                    [options.react]   Extra import lines.
 * @param {string|Function}           [options.state]   Code before the JSX; a function receives the story's args.
 * @param {string[]|Function}         [options.extra]   Props written by hand, after the args' props.
 * @param {string}                    [options.children] JSX inside the component.
 * @param {string[]}                  [options.omit]    Args that are replaced by `extra` or by state.
 */
export const usage =
	({ imports, react = "", state = "", extra = [], children = "", omit = [] }) =>
	(_code, { args }) => {
		const [name] = imports;
		const resolve = (v) => (typeof v === "function" ? v(args) : v);
		const extras = resolve(extra);
		const props = [
			...Object.entries(args)
				.filter(([k, v]) => !omit.includes(k) && v !== undefined && typeof v !== "function")
				.map(([k, v]) => attr(k, v)),
			...extras,
		];
		const open = props.length ? `<${name}\n${indent(props.join("\n"), 1)}\n` : `<${name}`;
		const jsx = children
			? `${open}>\n${indent(children, 1)}\n</${name}>`
			: `${open}${props.length ? "/>" : " />"}`;
		const head = [react, `import { ${imports.join(", ")} } from "${PACKAGE}";`]
			.filter(Boolean)
			.join("\n");
		const code = resolve(state);

		return [head, code, jsx].filter(Boolean).join("\n\n");
	};
