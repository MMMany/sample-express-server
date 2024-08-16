const capitalizeAll = require("./utils/capitalizeAll");

const TEST_STATE = {
  NOT_TESTED: "not tested",
  RUNNING: "running",
  CANCELING: "canceling",
  CANCELED: "canceled",
  PASS: "pass",
  FAIL: "fail",
  ERROR: "error",
  SKIP: "skip",
  WAIT: "wait",
};

for (const key in TEST_STATE) {
  TEST_STATE[key] = capitalizeAll(TEST_STATE[key]);
}

module.exports = {
  TEST_STATE,
};
