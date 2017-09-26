const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: '../js/far_away_js_browser.js',
  output: {
    filename: '../dist/FAJ_browser.js',
    libraryTarget: "umd"
  },
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
    })
  ]
};
