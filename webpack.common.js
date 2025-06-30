const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: {
		app: path.resolve(__dirname, "./src/scripts/index.js"),
		sw: path.resolve(__dirname, "./src/scripts/sw.js"),
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		clean: true,
	},
	module: {
		rules: [
			// {
			//   test: /\.css$/i,
			//   use: [
			//     {
			//       loader: 'style-loader',
			//       options: { injectType: 'styleTag' },
			//     },
			//     'css-loader',
			//   ],
			//   sideEffects: true,
			// },
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: "asset/resource",
				generator: {
					filename: "images/[name][ext][query]",
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/index.html",
			filename: "index.html",
		}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, "src/public"),
					to: path.resolve(__dirname, "dist"),
				},
			],
		}),
	],
};
