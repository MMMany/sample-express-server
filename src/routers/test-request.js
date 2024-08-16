const router = require("express").Router();
const logger = require("../utils/logger");
const { authVerify } = require("./auth");
const { SAMPLE_DATA, parseTreeToArray, parseArrayToTree } = require("../dummy/sample-data");
const { BadRequestError } = require("../utils/errors");
const _ = require("lodash");

router.get("/tc-list", (req, res) => {
  logger.info(req.method, req.originalUrl);

  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      const parsed = parseTreeToArray(SAMPLE_DATA);
      logger.debug("TC length :", parsed.length);
      res.json(JSON.stringify(parsed));
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

router.post("/select-tc", (req, res) => {
  logger.log(req.method, req.originalUrl);

  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      const { length, data } = req.body;
      if (!length || _.isNaN(parseInt(length))) {
        throw new BadRequestError("invalid length");
      }
      if (!data || _.isEmpty(data) || !_.isArray(data)) {
        throw new BadRequestError("invalid data");
      }
      if (length !== data.length) {
        throw new BadRequestError("invalid length and data");
      }
      const parsed = parseTreeToArray(SAMPLE_DATA);
      const findItems = data.map(({ id }) => parsed.find((tc) => tc.id === id));
      if (findItems.length !== length) {
        throw new BadRequestError("invalid tc");
      }
      logger.debug(data);
      logger.debug(findItems.length);
      const converted = parseArrayToTree(findItems);
      res.json(converted);
    })
    .catch((err) => {
      logger.error(err);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = {
  router,
};
