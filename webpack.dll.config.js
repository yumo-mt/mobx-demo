const webpack = require('webpack')
const library = '[name]_lib'
const path = require('path')
// const AssetsPlugin = require('assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    vendors: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-router'
    ]
  },
  output: {
    filename: '[name].dll.js',
    path: path.resolve(process.cwd(), 'dist'),
    library
  },
  plugins: [
    new CleanWebpackPlugin('dist'),
    new webpack.DllPlugin({
      path: path.join(__dirname, 'dist/[name]-manifest.json'),
      // This must match the output.library option above
      name: library
    }),
    // new AssetsPlugin({
    //   filename: 'bundle-config.json',
    //   // path: path.resolve(process.cwd(), 'dist'),
    // }),
  ],
}