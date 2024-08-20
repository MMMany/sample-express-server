const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = require("express").Router();
const logger = require('winston').loggers.get('was-logger');
const timestamp = require("../utils/timestamp");
const { authVerify } = require("./auth");

const uploadPath = (() => {
  const ret = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(ret)) fs.mkdirSync(ret);
  return ret;
})();

const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    logger.debug(JSON.stringify(file));
    logger.debug(`destination: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: (_, file, cb) => {
    const datetime = timestamp().split(".")[0];
    logger.debug(JSON.stringify(file));
    logger.debug(`filename: ${datetime}-${file.originalname}`);
    cb(null, `${datetime}-${file.originalname}`);
  },
});
const upload = multer({ storage }).single("file");

router.post("/upload", (req, res) => {
  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      upload(req, res, (err) => {
        if (err) {
          logger.error("failed file upload");
          throw err;
        }
        logger.debug(`uploaded file: ${req.file}`)
        logger.debug(`data: ${req.body}`);
        res.sendStatus(200);
      });
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = {
  router,
  uploadPath,
};
