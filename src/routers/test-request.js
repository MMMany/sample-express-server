const router = require("express").Router();
const logger = require("../utils/logger");
const { authVerify } = require("./auth");
const { SAMPLE_DATA_2: SAMPLE_DATA, convertJson } = require("../dummy/sample-data");
const { BadRequestError } = require("../utils/errors");
const _ = require("lodash");

router.get("/tc-list", (req, res) => {
  logger.info(req.method, req.originalUrl);

  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        res.cookie("xt-access-token", token);
      }
      logger.debug("TC length :", SAMPLE_DATA.length);
      res.json(JSON.stringify(SAMPLE_DATA));
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
      const findItems = data.map(({ id }) => SAMPLE_DATA.find((tc) => tc.id === id));
      if (findItems.length !== length) {
        throw new BadRequestError("invalid tc");
      }
      logger.debug(data);
      logger.debug(findItems.length);
      const converted = convertJson(findItems);
      // logger.debug(JSON.stringify(converted, null, 2));
      res.json(converted);
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = {
  router,
};
