# Contrast helpers

- `resolveColor(color)` resolves `var(--name)` (with its fallback) from the page's CSS variables. Anything else comes back as given.
- `swatchBorder(color, background = "#fff", outline = "#000")` returns `outline` when `color` has under 3:1 contrast against `background` (WCAG 1.4.11), otherwise `color`. Use it for a swatch's border so pale colors stay visible.
