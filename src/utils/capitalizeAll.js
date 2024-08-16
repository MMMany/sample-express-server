const _ = require("lodash");

const capitalizeAll = (str) => {
  if (typeof str !== "string") throw new Error("invalid type");
  return str
    .trim()
    .split(" ")
    .filter((v) => v.length > 0)
    .map((v) => _.capitalize(v))
    .join(" ");
};

module.exports = capitalizeAll;
