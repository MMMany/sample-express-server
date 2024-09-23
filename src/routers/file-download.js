const fs = require("fs");
const router = require("express").Router();
const logger = require('winston').loggers.get('was-logger');
const { authVerify } = require("./auth");
const { NotFoundError } = require("../utils/errors");
const { uploadPath } = require("./file-upload");
const path = require("path");

router.get("/download", (req, res) => {
  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      // @ts-ignore
      const filePath = path.join(uploadPath, req.query.file);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError("file not found");
      }
      res.download(filePath);
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = router;
