/**
 * External dependencies.
 */
import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

extend([a11yPlugin]);

const VAR = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)$/;

/**
 * A color with any `var(--name)` resolved from the page's CSS variables, so contrast can be measured.
 * Anything else, or a variable that isn't set, comes back as given.
 *
 * @param {string} color Hex, named color or CSS variable reference.
 * @return {string} Resolved color.
 */
export function resolveColor(color) {
	const match = typeof color === "string" && color.trim().match(VAR);
	if (!match || typeof document === "undefined") {
		return color;
	}
	const value = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue(match[1])
		.trim();
	return value || match[2]?.trim() || color;
}

/**
 * Border color for a color swatch: `outline` (black by default) when the data color is too faint
 * against the background to meet the 3:1 non-text contrast minimum (WCAG
 * 1.4.11), otherwise the data color itself.
 *
 * @param {string} color        Data color.
 * @param {string} [background] Background color.
 * @param {string} [outline]    Border used when the contrast is too low.
 */
export function swatchBorder(
	color,
	background = "#ffffff",
	outline = "#000000",
) {
	const data = colord(resolveColor(color) || "");
	if (!data.isValid() || !colord(resolveColor(background)).isValid()) {
		return color;
	}
	return data.contrast(resolveColor(background)) < 3 ? outline : color;
}
