import { transformAsync } from "@babel/core";

// Our source uses JSX in .js files, which Vite doesn't parse by default. Run
// them through the same WordPress Babel preset the package build uses.
const babelJsx = () => ({
	name: "rkv-babel-jsx",
	enforce: "pre",
	async transform(code, id) {
		if (!/\/(src|\.storybook)\/.*\.js$/.test(id) || id.includes("node_modules")) {
			return null;
		}

		const result = await transformAsync(code, {
			filename: id,
			babelrc: false,
			configFile: false,
			presets: ["@wordpress/babel-preset-default"],
			sourceMaps: true,
		});

		return { code: result.code, map: result.map };
	},
});

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
	stories: ["../src/**/*.stories.js"],
	framework: { name: "@storybook/react-vite", options: {} },
	core: { disableTelemetry: true },
	viteFinal: (config) => ({
		...config,
		plugins: [babelJsx(), ...(config.plugins || [])],
		optimizeDeps: {
			...config.optimizeDeps,
			// Babel adds these imports after the scan, so it can't discover them.
			include: [
				...(config.optimizeDeps?.include || []),
				"react",
				"react/jsx-runtime",
				"react/jsx-dev-runtime",
				"react-dom",
			],
			// Vite scans stories and their imports for dependencies to pre-bundle
			// before any plugin runs, so its parser needs to accept JSX in .js too.
			rolldownOptions: {
				...config.optimizeDeps?.rolldownOptions,
				moduleTypes: { ".js": "jsx" },
			},
		},
	}),
};
