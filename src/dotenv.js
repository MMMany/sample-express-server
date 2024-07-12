"use strict";

const fs = require("fs");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error("The NODE_ENV environment variable is required but was not specified.");
} else if (NODE_ENV === "development") {
  const dotenvFiles = [
    `.env.${NODE_ENV}.local`,
    NODE_ENV !== "test" && ".env.local",
    `.env.${NODE_ENV}`,
    ".env",
  ].filter(Boolean);

  dotenvFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      require("dotenv-expand").expand(
        require("dotenv").config({
          path: file,
        })
      );
    }
  });
}
