"use strict";

const fs = require("fs");

const NODE_ENV = process.env.NODE_ENV || "development";

const dotenvFiles = [`.env.${NODE_ENV}.local`, NODE_ENV !== "test" && ".env.local", `.env.${NODE_ENV}`, ".env"].filter(
  Boolean
);

dotenvFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    require("dotenv-expand").expand(
      require("dotenv").config({
        path: file,
      })
    );
  }
});

console.log(dotenvFiles);
console.log(process.env.NODE_ENV);
console.log(process.env.PRIVATE_KEY_PATH);
console.log(process.env.PORT);
