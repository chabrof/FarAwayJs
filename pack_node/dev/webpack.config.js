module.exports = {
  entry: '../../js/far_away_node.js',
  output: {
    filename: '../../dist/FA_node.js',
    libraryTarget: "commonjs2"
  },
  target: 'node',
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
  }
};
