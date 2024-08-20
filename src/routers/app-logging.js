const router = require("express").Router();
const { BadRequestError } = require("../utils/errors");
const logger = require("../utils/logger");
const { authVerify } = require("./auth");

router.post("/app-log", (req, res) => {
  logger.info(req.method, req.originalUrl);

  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      const { level, message } = req.body;
      if (!level || !message) throw new BadRequestError('invalid body');
      if (logger[level.toLowerCase()]) {
        logger[level.toLowerCase()](`[APP] ${message}`);
        res.sendStatus(200);
      } else {
        throw new BadRequestError('invalid level');
      }
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(400);
    });
});

module.exports = { router };
