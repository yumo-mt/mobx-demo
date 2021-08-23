const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const DllLinkPlugin = require("dll-link-webpack-plugin");
// const bundleConfig = require("./bundle-config.json");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src", "index.js")
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]_[contenthash:12].js",
    chunkFilename: "[name]_[contenthash:12].js"
    // library: '[name]',
  },
  resolve: {
    extensions: [".ts",".tsx",".js", ".jsx", ".css", ".less", ".json"],
    alias: {
      $component: path.resolve("./", "src/component")
    }
  },
  // 基础目录，绝对路径，用于从配置中解析入口起点(entry point) 和 loader
  context: path.resolve(__dirname),
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.(js|jsx)$/,
        // 可以是正则表达式，可以是绝对路径的字符串，还可以是个函数，数组
        exclude: path.resolve(__dirname, "node_modules"), //  表示哪些目录中的文件不要进行 loader处理
        include: path.resolve(__dirname, "src"),
        use: ["babel-loader"]
      },
    ]
  },
  optimization: {
    // minimize: false,
    // 采用splitChunks提取出entry chunk的chunk Group
    splitChunks: {
      cacheGroups: {
        // 处理入口chunk
        commons: {
          test: /[\\/]src[\\/]component[\\/]/,
          name: "commons",
          // minSize: 30000,
          // minChunks: 3,
          chunks: "all",
          priority: -1,
          reuseExistingChunk: true // 这个配置允许我们使用已经存在的代码块
        }
        //  是否将common下的 组件的css单独打包出来，开启下面配置
        // styles: {
        //   name: 'styles',
        //   test: /\.less|css$/,
        //   chunks: 'all',	// merge all the css chunk to one file
        //   enforce: true
        // }
      }
    }
    // 为每个入口提取出webpack runtime模块
    // runtimeChunk: true,
    // 等价于
    // runtimeChunk: {
    //   name: 'runtime'
    // }
  },
  plugins: [
    //  使用dll来打包第三方代码  被dll-link  替换了
    // new webpack.DllReferencePlugin({
    //   context: __dirname,
    //   manifest: require('./dist/vendors-manifest.json')
    // }),
    // new DllLinkPlugin({
    //   config: require("./webpack.dll.config.js"),
    // }),
    new HtmlWebpackPlugin({
      // 如果配置此项 需要在HTML模板中的title标签中增加   <%= htmlWebpackPlugin.options.title %>
      title: "Webpack4",
      hash: true, //防止缓存
      template: "./src/www/index.html",
      filename: "index.html",
      // 使用 AssetsPlugin 打包生成的 json文件
      // bundleName: bundleConfig.vendors.js,
      // 需要将dll 文件链接到html 中
      vendorsName: "vendors.dll.js"
    })
  ]
};
