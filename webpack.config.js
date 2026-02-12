const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const Dotenv = require("dotenv-webpack");

module.exports = (webpackConfigEnv, argv) => {
  const orgName = "Truck";
  const envFile = `.env.${webpackConfigEnv.env}`;
  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf|otf|svg)$/,
          use: [
            {
              loader: "file-loader",
            },
          ],
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: envFile,
      }),
      new HtmlWebpackPlugin({
        inject: false,
        template: "src/index.ejs",
        templateParameters: {
          isLocal: webpackConfigEnv.isLocal,
          isProd: webpackConfigEnv.isProd,
          isQa: webpackConfigEnv.isQa,
          isDev: webpackConfigEnv.isDev,
          orgName: orgName
        },
      }),
    ],
  });
};
