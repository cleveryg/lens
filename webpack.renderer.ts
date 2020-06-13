import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserWebpackPlugin from "terser-webpack-plugin";
import { htmlTemplate, isDevelopment, isProduction, outDir, rendererDir, sassCommonVars, tsConfigFile } from "./src/common/vars";
import { libraryTarget, manifestPath } from "./webpack.dll";

export default function (): webpack.Configuration {
  const VueLoaderPlugin = require("vue-loader/lib/plugin");

  return {
    target: "electron-renderer",
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "eval-source-map",
    cache: isDevelopment,
    entry: {
      // renderer: path.resolve(rendererDir, "component/app.tsx"),
      renderer_vue: path.resolve(rendererDir, "_vue/index.js"),
    },
    output: {
      path: outDir,
      filename: '[name].js',
      chunkFilename: 'chunks/[name].js',
    },
    resolve: {
      alias: {
        "@": rendererDir,
      },
      extensions: [
        '.js', '.jsx', '.json',
        '.ts', '.tsx',
        '.vue',
      ]
    },
    optimization: {
      minimize: false,
      minimizer: [
        new TerserWebpackPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          extractComments: {
            condition: "some",
            banner: [
              `Lens - The Kubernetes IDE. Copyright ${new Date().getFullYear()} by Lakend Labs, Inc. All rights reserved.`
            ].join("\n")
          }
        })
      ],
    },

    module: {
      rules: [
        {
          test: /\.node$/,
          use: "node-loader"
        },
        {
          test: /\.jsx?$/,
          use: "babel-loader"
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            "babel-loader",
            {
              loader: "ts-loader",
              options: {
                configFile: tsConfigFile,
                compilerOptions: {
                  // localization support
                  // https://lingui.js.org/guides/typescript.html
                  jsx: "preserve",
                  target: "es2016",
                },
              }
            }
          ]
        },
        {
          test: /\.vue$/,
          use: {
            loader: "vue-loader",
            options: {
              shadowMode: false,
              loaders: {
                css: "!!vue-style-loader!css-loader",
                scss: "!!vue-style-loader!css-loader!sass-loader",
              }
            }
          }
        },
        {
          test: /\.(jpg|png|svg|map|ico)$/,
          use: 'file-loader?name=assets/[name]-[hash:6].[ext]'
        },
        {
          test: /\.(ttf|eot|woff2?)$/,
          use: 'file-loader?name=fonts/[name].[ext]'
        },
        {
          test: /\.s?css$/,
          use: [
            isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: isDevelopment
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: isDevelopment,
                prependData: `@import "${path.basename(sassCommonVars)}";`,
                sassOptions: {
                  includePaths: [
                    path.dirname(sassCommonVars)
                  ]
                },
              }
            },
          ]
        }
      ]
    },

    plugins: [
      new VueLoaderPlugin(), // todo: remove with _"vue/*"

      // todo: check if this actually works in mode=production files
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: manifestPath,
        sourceType: libraryTarget,
      }),

      new HtmlWebpackPlugin({
        template: htmlTemplate,
        inject: true,
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
    ],
  }
}