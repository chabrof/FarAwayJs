module.exports = {
  entry: '../js/far_away_js.js',
  output: {
    filename: '../dist/FAJ_node.js',
    libraryTarget: "commonjs2"
  },
  target: 'node',
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
