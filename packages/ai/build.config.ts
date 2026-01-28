import { resolve } from "node:path";
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	name: "@databuddy/ai",
	entries: [
		"./src/vercel/index.ts",
		"./src/openai/index.ts",
	],
	externals: ["@ai-sdk/provider", "ai", "openai", "tokenlens", "uuid"],
	rollup: {
		emitCJS: false,
		esbuild: {
			minify: false,
		},
	},
	declaration: true,
	alias: {
		"@": resolve(__dirname, "src"),
	},
});
