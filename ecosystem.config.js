"use strict";

let appName = "sample-express-app";

let NODE_ENV = "production";

const argv = process.argv;
if (!argv.includes("--env") || !argv.includes("production")) {
  NODE_ENV = "development";
  appName += "-dev";
}

const datetime = new Date().toJSON().slice(0, -1);
const date = datetime
  .split("T")[0]
  .split("-")
  .map((v) => (v.length > 2 ? v.slice(2) : v))
  .join("");
const time = datetime.split("T")[1].split(":").join("");
const timestamp = `${date}-${time}`;

const appInfo = {
  name: appName,
  script: "src/index.js",
  watch: NODE_ENV === "production" ? false : ["src"],
  env: {
    NODE_ENV,
  },
  time: true,
  log_file: `logs/${NODE_ENV}/${timestamp}_${appName}.log`,
  out_file: `logs/${NODE_ENV}/${timestamp}_${appName}_out.log`,
  error_file: `logs/${NODE_ENV}/${timestamp}_${appName}_error.log`,
};

if (NODE_ENV === "production") {
  appInfo.max_restarts = 10;
  appInfo.restart_delay = 5000; // 5 sec
}

module.exports = {
  apps: [appInfo],

  // deploy: {
  //   production: {
  //     user: "SSH_USERNAME",
  //     host: "SSH_HOSTMACHINE",
  //     ref: "origin/master",
  //     repo: "GIT_REPOSITORY",
  //     path: "DESTINATION_PATH",
  //     "pre-deploy-local": "",
  //     "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production",
  //     "pre-setup": "",
  //   },
  // },
};
