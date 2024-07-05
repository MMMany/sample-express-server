import "./dotenv.js";
import express from "express";
import apiFileDownload from "./routers/file-download.js";
import apiFileUpload from "./routers/file-upload.js";
import apiAuth from "./routers/auth.js";

const app = express();
const PORT = process.env.PORT;

const API_VERSION = "v1";

[apiFileDownload, apiFileUpload, apiAuth].forEach((api) => {
  app.use(`/${API_VERSION}`, api);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
