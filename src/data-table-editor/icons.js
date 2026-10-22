/**
 * WordPress dependencies.
 */
import { SVG, Path } from "@wordpress/components";

// Custom, drawn to match the @wordpress/icons 24px / 1.5px-stroke style.
export const clipboardPaste = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style={{ fill: "none" }}
		stroke="currentColor"
		strokeWidth="1.5"
	>
		<Path
			d="M9.5 5.25H7C6.31 5.25 5.75 5.81 5.75 6.5V18C5.75 18.69 6.31 19.25 7 19.25H17C17.69 19.25 18.25 18.69 18.25 18V6.5C18.25 5.81 17.69 5.25 17 5.25H14.5"
			vectorEffect="non-scaling-stroke"
		/>
		<Path
			d="M9.5 4.75C9.5 4.34 9.84 4 10.25 4H13.75C14.16 4 14.5 4.34 14.5 4.75V6.25C14.5 6.66 14.16 7 13.75 7H10.25C9.84 7 9.5 6.66 9.5 6.25V4.75Z"
			vectorEffect="non-scaling-stroke"
		/>
		<Path
			d="M12 10V16M9.5 13.75L12 16.25L14.5 13.75"
			vectorEffect="non-scaling-stroke"
		/>
	</SVG>
);
