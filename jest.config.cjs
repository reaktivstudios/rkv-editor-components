module.exports = {
	testEnvironment: "jsdom",
	roots: ["<rootDir>/src"],
	moduleNameMapper: {
		"\\.(s?css)$": "<rootDir>/test/style-mock.cjs",
	},
};
