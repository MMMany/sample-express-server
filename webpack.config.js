"use strict";

import fs from "fs";
import webpack from "webpack";
import ModuleScopePlugin from "react-dev-utils/ModuleScopePlugin.js";
import paths, { moduleFileExtensions } from "./scripts/paths.js";
import modules from "./scripts/modules.js";
import { getClientEnvironment } from "./scripts/env.js";
import ModuleNotFoundPlugin from "react-dev-utils/ModuleNotFoundPlugin.js";

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

import TerserPlugin from "terser-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
const { DefinePlugin, IgnorePlugin } = webpack;

const useTypeScript = fs.existsSync(paths.appTsConfig);

export default (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  return {
    stats: "errors-warnings",
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isEnvDevelopment && "cheap-module-source-map",
    target: "node",
    entry: paths.appIndexJs,
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename: "bundle.js",
      chunkFilename: "bundle.chunk.js",
      publicPath: paths.publicUrlOrPath,
    },
    infrastructureLogging: {
      level: "none",
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
          },
        }),
      ],
    },
    resolve: {
      modules: ["node_modules", paths.appNodeModules].concat(modules.additionalModulePaths || []),
      extensions: moduleFileExtensions.map((ext) => `.${ext}`).filter((ext) => useTypeScript || !ext.includes("ts")),
      alias: {
        ...(modules.webpackAliases || {}),
      },
      plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])],
    },
    module: {
      strictExportPresence: true,
      rules: [
        shouldUseSourceMap && {
          enforce: "pre",
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|ts|tsx)$/,
          loader: "source-map-loader",
        },
        {
          oneOf: [
            // Process application JS with Babel
            {
              test: /\.(js|mjs|ts)$/,
              include: paths.appSrc,
              loader: "babel-loader",
              options: {
                compact: isEnvProduction,
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: "babel-loader",
              options: {
                compact: false,
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap,
              },
            },
          ],
        },
        // {
        //   test: /\.(js|mjs|ts)$/,
        //   exclude: /node_modules/,
        //   use: {
        //     loader: "babel-loader",
        //   },
        // },
      ].filter(Boolean),
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: "public", to: "public" }],
      }),
      new ModuleNotFoundPlugin(paths.appPath),
      new DefinePlugin(env.stringified),
      new IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    ].filter(Boolean),
    performance: false,
  };
};
