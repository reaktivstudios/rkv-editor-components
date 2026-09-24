// The build compiles each component's editor.scss to editor.css next to its
// JS, so point the imports at the compiled CSS. Consumers then need a CSS
// loader, not a Sass one.
const rewriteScssImports = () => ({
	visitor: {
		ImportDeclaration({ node }) {
			node.source.value = node.source.value.replace(/\.scss$/, ".css");
		},
	},
});

module.exports = {
	presets: ["@wordpress/babel-preset-default"],
	plugins: [rewriteScssImports],
};
