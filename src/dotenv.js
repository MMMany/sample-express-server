import fs from "fs";
import dotenv from "dotenv";
import { expand as dotenvExpand } from "dotenv-expand";

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error("The NODE_ENV environment variable is required but was not specified.");
}

const dotenvFiles = [`.env.${NODE_ENV}.local`, NODE_ENV !== "test" && ".env.local", `.env.${NODE_ENV}`, ".env"].filter(
  Boolean
);

dotenvFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    dotenvExpand(
      dotenv.config({
        path: [file],
      })
    );
  }
});
