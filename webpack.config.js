/**
 * 说明: webpack的配置请在该文件进行修改
 * webpack配置文档请查看:https://webpack.github.io/docs/configuration.html
 */

var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');
var glob = require('glob');
var RaxPlugin = require('rax-webpack-plugin');
var LiveReloadPlugin = require('webpack-livereload-plugin');

var srcPath = path.resolve(__dirname, './src'),
    outputPath = path.resolve(__dirname, './build');


/**
 * 获取demo文件夹中的入口文件
 * @param cwd
 * @returns {{}}
 */
function getDevEntry(cwd) {
    entry = { "detail/index": ["detail/index.jsx"], "home/index": ["home/index.jsx"], "index": ["index.jsx"], "order/index": ["order/index.jsx"] };
    return entry;
}

var config = {

    //服务器开启的端口号
    port: '3000',

    context: srcPath,

    //webpack 编译的入口文件
    entry: getDevEntry(srcPath),

    //输出的文件配置
    output: {
        path: outputPath,
        filename: '[name].js',
        publicPath: '/build/'
    },
    // vendor库内置后，需要在业务代码打包时排除vendor库
    "externals": [{
        "weex-rx": "commonjs rax",
        "rax": "commonjs rax",
        "nuke": "commonjs nuke",
        "QAP-SDK": "commonjs QAP-SDK",
        "genv": "commonjs genv",
    }],
    resolve: {
        root: srcPath,
        extensions: ['', '.js', '.jsx'],
        alias: {
            $root: srcPath,
            'weex-rx':'rax'//此别名用于处理nuke@0.4.3版本时，还未切换rax的情况。
        }
    },


    module: {
        // preLoaders: [{
        //     test: /\.(js|jsx)$/,
        //     exclude: path.resolve(__dirname, "node_modules"),
        //     loader: 'eslint'
        // }, ],

        loaders: [{
            test: /\.(js|jsx)$/,
            include: [
                path.resolve(__dirname, "src")
            ],
            loaders: ['babel']
        }, {
            test: /\.(rxscss|scss)$/,
            loader: 'rx-css-loader!fast-sass'
        }]
    },

    plugins: [

        new RaxPlugin({target:'bundle'}),
        new webpack.BannerPlugin('// {"framework": "Rax"}', {raw: true}),

        ////Webpack gives IDs to identify your modules. With this plugin,
        //// Webpack will analyze and prioritize often used modules assigning them the smallest ids.
        new webpack.optimize.OccurenceOrderPlugin(),

        //进度插件
        new webpack.ProgressPlugin((percentage, msg) => {
            const stream = process.stderr;
            if (stream.isTTY && percentage < 0.71) {
                stream.cursorTo(0);
                stream.write(`📦   ${msg}`);
                stream.clearLine(1);
            }
            
            process.send && process.send({percentage:percentage, msg:msg});
        })
    ]
};




/**
 * 开发环境及demo编译时的配置
 * @returns {*}
 */
function dev() {

    var _config = _.cloneDeep(config);

    _config.plugins.push(

        new webpack.DefinePlugin({
            "process.env": { NODE_ENV: JSON.stringify('development') },
            "__DEV__": JSON.stringify(JSON.parse('true'))
        }),

        new LiveReloadPlugin()
    );

    //添加soure-map
    _config.devtool = 'source-map';

    return _config;
}


/**
 * 编译到demo文件夹的配置
 * 与dev的区别是不需要调试相关的配置
 */
function prod() {
    var _config = _.cloneDeep(config);

    _config.plugins.push(

        //查找相等或近似的模块，避免在最终生成的文件中出现重复的模块。
        new webpack.optimize.DedupePlugin(),
        //Webpack gives IDs to identify your modules. With this plugin,
        // Webpack will analyze and prioritize often used modules assigning them the smallest ids.
        new webpack.optimize.OccurenceOrderPlugin(),


        new webpack.DefinePlugin({
            "process.env": { NODE_ENV: JSON.stringify('production') },
            "__DEV__": JSON.stringify(JSON.parse('false'))
        }),

        //UglifyJs
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            compress: { warnings: false, drop_console: true },
            output: { comments: false }
        })

    );

    return _config;
}


module.exports = {
    dev: dev,
    prod: prod

};
//module.exports = dev();
