const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: '../../js/far_away_js_node.js',
  output: {
    filename: '../../dist/FAJ_node_min.js',
    libraryTarget: "commonjs2"
  },
  target: 'node',
  devtool: "source-map",
  module: {
    loaders: [{
        test: /\.js$/,
        include: [
          /\/js\//,
          /\/node_modules\/ws\//
        ],
        loader: 'babel-loader',
        query: {
          presets: ['env']
        }
      }
    ]
  },
  /*
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        mangle: false
      }
    })
  ]*/
};
