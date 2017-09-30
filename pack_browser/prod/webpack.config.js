const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: '../../js/far_away_browser.js',
  output: {
    filename: '../../dist/FA_browser_min.js',
    libraryTarget: "umd"
  },
  devtool: "source-map",
  module: {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['env']
        }
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true
    })
  ]
};
