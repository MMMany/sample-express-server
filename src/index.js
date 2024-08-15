require("./dotenv");
const express = require("express");
const apiFileDownload = require("./routers/file-download").router;
const apiFileUpload = require("./routers/file-upload").router;
const apiAuth = require("./routers/auth").router;
const apiTestRequest = require("./routers/test-request").router;
const logger = require("./utils/logger");
const cors = require("cors");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

[apiFileDownload, apiFileUpload, apiAuth, apiTestRequest].forEach((api) => {
  app.use("/v1", api);
});

app.all("*", (req, res) => {
  logger.warn(`invalid access (${req.method} ${req.path})`);
  logger.debug(app.mountpath);
  res.sendStatus(404);
});

app.listen(PORT, () => {
  logger.debug(`Server is running on port ${PORT}`);
});
