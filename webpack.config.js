//webpack.config.js
const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src/index.ts",
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, '.'),
    filename: "aleo-adapters-bundle.js",
    library: {
      type: "module"
    }
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    modules: [
      path.join(__dirname, './node_modules')
    ],
    extensions: [".ts", ".js",],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};