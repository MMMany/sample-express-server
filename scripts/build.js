"use strict";

const argv = process.argv.slice(2);
const isDevelopment = argv.indexOf("--dev") !== -1;

const NODE_ENV = isDevelopment ? "development" : "production";
process.env.NODE_ENV = NODE_ENV;

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});

const path = require("path");
const fs = require("fs-extra");
const paths = require("./paths");

const dotenvFiles = [`.env.${NODE_ENV}.local`, NODE_ENV !== "test" && ".env.local", `.env.${NODE_ENV}`, ".env"].filter(
  Boolean
);

let dotenvFile;
for (const file of dotenvFiles) {
  if (fs.existsSync(file)) {
    dotenvFile = paths.resolveApp(file);
    break;
  }
}
if (!dotenvFile) {
  throw new Error("Cannot find config file of environment variables");
}

function getDestination(target) {
  return path.join(paths.appBuild, path.basename(target));
}

async function startBuild() {
  return new Promise((resolve, reject) => {
    try {
      fs.emptydirSync(paths.appBuild);
      fs.copySync(paths.appSrc, getDestination(paths.appSrc), { recursive: true });
      fs.copySync(paths.appPublic, getDestination(paths.appPublic), { recursive: true });
      fs.copySync(paths.appNodeModules, getDestination(paths.appNodeModules), { recursive: true });
      fs.copyFileSync(dotenvFile, getDestination(paths.dotenv));
      fs.copyFileSync(paths.appPackageJson, getDestination(paths.appPackageJson));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

startBuild()
  .then(() => {
    console.log("Build completed");
    console.log();
  })
  .catch((err) => {
    console.error("Occurred unexpected error");
    console.error(err);
    console.log();
    process.exit(1);
  });
