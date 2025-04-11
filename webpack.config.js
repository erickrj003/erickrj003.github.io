const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        app: "./dev/js/app.js",
        cv: "./dev/js/cv.js",
        homepage: "./dev/js/homepage.js",
    },
    output: {
        filename: "[name].min.js",
        path: path.resolve(__dirname, "dist"),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].min.css",
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'dist/*.min.css',
                    to: 'assets/css/[name][ext]',
                    noErrorOnMissing: true
                },
                {
                    from: 'dist/*.min.js',
                    to: 'assets/js/[name][ext]',
                    noErrorOnMissing: true
                },
                {
                    from: 'dist/*.map',
                    to: 'assets/[ext]/[name][ext]',
                    noErrorOnMissing: true
                }
            ]
        }),
    ],
    devtool: 'source-map',
    watchOptions: {
        ignored: /node_modules/
    },
};