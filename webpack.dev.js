
const path = require('path');
// 替换 ExtractTextWebapckPlugin  实现 CSS 单独打包
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// autoprefixer解析CSS文件并且添加浏览器前缀到CSS规则里，使用Can I Use的数据来决定哪些前缀是需要的。可删可增
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.common')


module.exports = merge(commonConfig, {
  module: {
    rules: [
      // {
      //   test: /\.(js|jsx)$/,
      //   exclude: /node_modules/,
      //   use: ['babel-loader',
      //   'lazyload-loader'
      //   ]
      // },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true,
              localIdentName: '[name]__[local]_[hash:base64:5]',
            },
          },
        ]
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
    ]
  },
  // https://webpack.docschina.org/configuration/devtool
  devtool: 'eval-source-map',
  cache: true,
  devServer: {//配置此静态文件服务器，可以用来预览打包后项目
    contentBase: path.resolve(__dirname, 'dist'),//开发服务运行时的文件根目录
    port: 9090,//端口号
    compress: true,//开发服务器是否启动gzip等压缩
    host: "localhost",
    // 任意的 404 响应都可能需要被替代为 index.html
    historyApiFallback: true,
  },
  plugins: [
    // //热加载插件 
    // new webpack.HotModuleReplacementPlugin()
  ],

})

