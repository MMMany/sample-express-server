"use strict";

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});

// Ensure environment variables are read.
require("./env");

const path = require("path");
const chalk = require("react-dev-utils/chalk");
const fs = require("fs-extra");
const bfj = require("bfj");
const webpack = require("webpack");
const configFactory = require("./webpack.config");
const paths = require("./paths");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const FileSizeReporter = require("./FileSizeReporter");
const printBuildError = require("react-dev-utils/printBuildError");
const recursive = require("recursive-readdir");
const gzipSize = require("gzip-size").sync;
const filesize = require("filesize");

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appIndexJs])) {
  process.exit(1);
}

const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf("--stats") !== -1;
const clearCache = argv.indexOf("--clear-cache") !== -1;

// Generate configuration
const config = configFactory("production");

// for clear cache
function checkClearCache(buildFolder) {
  function measureFileSize(directoryPath) {
    return new Promise((resolve) => {
      recursive(directoryPath, (err, fileNames) => {
        let sizes = 0;
        if (!err && fileNames) {
          fileNames.forEach((fileName) => {
            sizes += gzipSize(fileName);
          });
        }
        resolve(sizes);
      });
    });
  }

  if (clearCache) {
    let cachePath = path.join(paths.appNodeModules, ".cache");
    return measureFileSize(cachePath).then((fileSize) => {
      console.log(
        "Clear " +
          chalk.dim(path.join(path.basename(paths.appNodeModules), ".cache")) +
          " : " +
          chalk.green(filesize(fileSize))
      );
      fs.emptydirSync(cachePath);
      console.log();
      return buildFolder;
    });
  } else {
    return new Promise((resolve) => {
      resolve(buildFolder);
    });
  }
}

// Build
checkClearCache(paths.appBuild)
  .then((buildFolder) => {
    return measureFileSizesBeforeBuild(buildFolder);
  })
// measureFileSizesBeforeBuild(paths.appBuild)
  .then((previousFileSizes) => {
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);
    // Start the webpack build
    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow("Compiled with warnings.\n"));
        console.log(warnings.join("\n\n"));
        console.log(
          "\nSearch for the " + chalk.underline(chalk.yellow("keywords")) + " to learn more about each warning."
        );
        console.log("To ignore, add " + chalk.cyan("// eslint-disable-next-line") + " to the line before.\n");
      } else {
        console.log(chalk.green("Compiled successfully.\n"));
      }

      console.log("File sizes after gzip:\n");
      printFileSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE
      );
      console.log();
    },
    (err) => {
      const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === "true";
      if (tscCompileOnError) {
        console.log(
          chalk.yellow(
            "Compiled with the following type errors (you may want to check these before deploying your app):\n"
          )
        );
        printBuildError(err);
      } else {
        console.log(chalk.red("Failed to compile.\n"));
        printBuildError(err);
        process.exit(1);
      }
    }
  )
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });

// Create the production build and print the deployment instructions.
function build(previousFileSizes) {
  console.log("Creating an optimized production build...");

  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }

        let errMessage = err.message;

        // Add additional information for postcss errors
        if (Object.prototype.hasOwnProperty.call(err, "postcssNode")) {
          errMessage += "\nCompileError: Begins at CSS selector " + err["postcssNode"].selector;
        }

        messages = formatWebpackMessages({
          errors: [errMessage],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(stats.toJson({ all: false, warnings: true, errors: true }));
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join("\n\n")));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== "string" || process.env.CI.toLowerCase() !== "false") &&
        messages.warnings.length
      ) {
        // Ignore sourcemap warnings in CI builds. See #8227 for more info.
        const filteredWarnings = messages.warnings.filter((w) => !/Failed to parse source map/.test(w));
        if (filteredWarnings.length) {
          console.log(
            chalk.yellow(
              "\nTreating warnings as errors because process.env.CI = true.\n" +
                "Most CI servers set it automatically.\n"
            )
          );
          return reject(new Error(filteredWarnings.join("\n\n")));
        }
      }

      const resolveArgs = {
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      };

      if (writeStatsJson) {
        return bfj
          .write(paths.appBuild + "/bundle-stats.json", stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch((error) => reject(new Error(error)));
      }

      return resolve(resolveArgs);
    });
  });
}
