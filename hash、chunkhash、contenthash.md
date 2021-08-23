# hash
>  官方定义：[hash] is replaced by the hash of the compilation.

代表的是compilation的hash值

## compilation
compilation对象代表某个版本的资源对应的编译进程。 当每次webpack打包的过程中，每次检测到项目文件有改动就会创建一个compilation。进而能够针对改动生产全新的编译文件。compilation对象包含当前模块资源、待编译文件、有改动的文件和监听依赖的所有信息

compilation在项目中任何一个文件改动后就会被重新创建，然后webpack计算新的compilation的hash值，这个hash值便是hash。

```
output: {
    filename: '[name].[hash:8].js',
    path: __dirname + '/dist'
}
```
hash是compilation对象计算所得，而不是具体的项目文件计算所得。所以以上配置的编译输出文件，所有的文件名都会使用相同的hash指纹,一旦有文件改动，所有的文件名都会更改，毫无缓存可言。


# chunkhash
> 官方定义：[chunkhash] is replaced by the hash of the chunk.

代表的是chunk的hash值

`chunkhash`很好理解，chunk在Webpack中的含义我们都清楚，简单讲chunk就是模块。`chunkhash`也就是根据模块内容计算出的hash值。所以某个文件的改动只会影响它本身的hash，不会影响其他文件。
```
output: {
    filename: '[name].[chunkhash:8].js',
    path: __dirname + '/dist'
}

```
在css 没有成为webpack 一等公民 之前 ，会出现一种问题。 
js 文件中引入style文件，webpack 默认将css 和js 打包到一个文件中，我们可以使用 `extract-text-webpack-plugin` 或者 `mini-css-extract-plugin` 将style 文件单独编译成一个文件。
这个时候会出现一种问题 ： **css 文件和 js 文件的  hash 相同**。无论是单独修改了js代码还是style代码，编译输出的js/css文件都会打上全新的相同的hash。这种状况下我们无法有效的进行版本管理和缓存利用。

这种问题的出现原因 是webpack的编译理念： webpack 将 style 视为  js的一部分，所以在计算`chunkhash`时，会把所有的js代码和style代码混合在一起计算。
```
// main.js
import 'main.scss';
alert('I am main.js');
```

```
// main.css
.wormpex:{
    color: red;
}
```
所以，不论是修改了js代码还是scss代码，整个chunk的内容都改变了，计算所得的chunkhash自然就不同了。

then ? 如何结果这个问题

# contenthash

使用`MiniCssExtractPlugin` 单独编译css 导致上述问题的配置。
```
 new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
      chunkFilename: '[id].[chunkhash].css'
    }),
```

so  `MiniCssExtractPlugin` 会提供另外一种 hash，`contenthash` 。`contenthash`代表的是文本文件内容的hash值，也就是只有style文件的hash值。 so 配置 可以改为
```
 new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),
```
这个时候 编译输出的js和css文件将会有其独立的hash。 修改js不会 更改style文件的hash。

又一问题， 如果我们修改css 代码 会影响js的hash 值吗？emmm…… js 的output 配置 修改成 contenthash 就不会了。

