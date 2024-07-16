"use strict";

const path = require("path");
const fs = require("fs");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

module.exports = {
  dotenv: resolveApp(".env"),
  appPath: resolveApp("."),
  appBuild: resolveApp(process.env.BUILD_PATH || "dist"),
  appPublic: resolveApp("public"),
  appPackageJson: resolveApp("package.json"),
  appSrc: resolveApp("src"),
  appNodeModules: resolveApp("node_modules"),
};

module.exports.resolveApp = resolveApp;
