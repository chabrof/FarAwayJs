module.exports = {
  entry: '../../js/far_away_js_browser.js',
  output: {
    filename: '../../dist/FAJ_browser.js',
    libraryTarget: "umd"
  },
  devtool: "eval-source-map",
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
  }
};
