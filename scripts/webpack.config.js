"use strict";

const fs = require("fs");
const webpack = require("webpack");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const paths = require("./paths");
const modules = require("./modules");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const getCacheIdentifier = require("react-dev-utils/getCacheIdentifier");

const createEnvironmentHash = require("./createEnvironmentHash");

// if you don't want to use souce-map, uncomment this line
process.env.GENERATE_SOURCEMAP = false;

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const useTypeScript = fs.existsSync(paths.appTsConfig);

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  return {
    stats: "errors-warnings",
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    bail: isEnvProduction,
    // devtool: isEnvProduction
    //   ? shouldUseSourceMap
    //     ? "source-map"
    //     : false
    //   : isEnvDevelopment && "cheap-module-source-map",
    target: "node",
    entry: paths.appIndexJs,
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename: "bundle.js",
      chunkFilename: "bundle.chunk.js",
      publicPath: paths.publicUrlOrPath,
    },
    cache: {
      type: "filesystem",
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: "pack",
      buildDependencies: {
        defaultWebpack: ["webpack/lib/"],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) => fs.existsSync(f)),
      },
    },
    infrastructureLogging: {
      level: "none",
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            // mangle: shouldUseSourceMap,
            mangle: false,
          },
        }),
      ],
    },
    resolve: {
      modules: ["node_modules", paths.appNodeModules].concat(modules.additionalModulePaths || []),
      extensions: paths.moduleFileExtensions
        .map((ext) => `.${ext}`)
        .filter((ext) => useTypeScript || !ext.includes("ts")),
      alias: {
        ...(modules.webpackAliases || {}),
      },
      plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        // shouldUseSourceMap && {
        //   enforce: "pre",
        //   exclude: /@babel(?:\/|\\{1,2})runtime/,
        //   test: /\.(js|cjs)$/,
        //   loader: "source-map-loader",
        // },
        {
          test: /\.(js|cjs)$/,
          include: paths.appSrc,
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
            ],
            babelrc: false,
            configFile: false,
            compact: isEnvProduction,
            cacheIdentifier: getCacheIdentifier(isEnvProduction ? "production" : isEnvDevelopment && "development", [
              "react-dev-utils",
            ]),
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
      ].filter(Boolean),
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: "public", to: "public" }],
      }),
      new ModuleNotFoundPlugin(paths.appPath),
      new webpack.DefinePlugin(env.stringified),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    ].filter(Boolean),
    performance: false,
  };
};
