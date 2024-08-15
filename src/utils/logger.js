const timestamp = require("./timestamp");

const info = (...argv) => {
  console.info(`[${timestamp()}][I]`, ...argv);
};

const debug = (...argv) => {
  console.debug(`[${timestamp()}][D]`, ...argv);
};

const warn = (...argv) => {
  console.warn(`[${timestamp()}][W]`, ...argv);
};

const error = (...argv) => {
  console.error(`[${timestamp()}][E]`, ...argv);
};

const log = (...argv) => {
  console.log(`[${timestamp()}][L]`, ...argv);
};

module.exports = {
  info,
  debug,
  warn,
  error,
  log,
};
