/**
 * Internal dependencies
 */
import { resolveColor, swatchBorder } from "./index.js";

describe("resolveColor", () => {
	afterEach(() => document.documentElement.removeAttribute("style"));

	it("resolves a set CSS variable", () => {
		document.documentElement.style.setProperty("--brand", "#123456");
		expect(resolveColor("var(--brand)")).toBe("#123456");
	});

	it("uses the fallback for an unset variable and passes other colors through", () => {
		expect(resolveColor("var(--missing, #abcdef)")).toBe("#abcdef");
		expect(resolveColor("#ff0000")).toBe("#ff0000");
	});
});

describe("swatchBorder", () => {
	it("returns the outline when the color is too faint against the background", () => {
		expect(swatchBorder("#f5f5f5", "#ffffff", "#000000")).toBe("#000000");
	});

	it("keeps the color when the contrast is enough", () => {
		expect(swatchBorder("#1e1e1e", "#ffffff")).toBe("#1e1e1e");
	});

	it("returns an unparseable color as given", () => {
		expect(swatchBorder("not-a-color")).toBe("not-a-color");
	});
});
