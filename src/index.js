require("./dotenv");
const express = require("express");
const apiFileDownload = require("./routers/file-download");
const apiFileUpload = require("./routers/file-upload");
const apiAuth = require("./routers/auth");

const app = express();
const PORT = process.env.PORT;

const API_VERSION = "v1";

app.use(express.json());

[apiFileDownload, apiFileUpload, apiAuth].forEach((api) => {
  app.use(`/${API_VERSION}`, api.router);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
