const jwt = require("jsonwebtoken");
const fs = require("fs");
const router = require("express").Router();
const path = require("path");
const homedir = require("os").homedir();
const logger = require("../utils/logger");
const { BadRequestError, UnauthorizedError } = require("../utils/errors");

const getSecretKey = () => {
  // return fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
  return fs.readFileSync(path.join(homedir, ".ssh", process.env.PRIVATE_KEY_NAME));
};

const generateToken = (payload, expiresIn) => {
  return jwt.sign({ ...payload }, getSecretKey(), { expiresIn });
};

const parseToken = async (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.split(" ")[1] ?? req.cookies["xt-access-token"];
};

const verify = async (token) => {
  try {
    jwt.verify(token, getSecretKey());
    return true;
  } catch (err) {
    if (err.message === "jwt expired") {
      return false;
    } else if (err.message === "invalid token") {
      return new UnauthorizedError(err.message);
    }
    throw err;
  }
};

const authVerify = async (req) => {
  let token = await parseToken(req);
  let refreshed = false;
  if (!(await verify(token))) {
    // check refresh token
    if (await verify(req.cookies["xt-refresh-token"])) {
      token = generateToken("1h");
      refreshed = true;
    }
  }
  return { token, refreshed };
};

router.get("/generate-token", (req, res) => {
  logger.info(req.method, req.originalUrl);

  try {
    const requester = req.query.requester;
    if (!requester || requester.trim().length === 0) {
      logger.debug("there is no 'requester' in body");
      throw new BadRequestError();
    }
    const payload = {
      user: requester,
      t: Date.now(),
    };
    const access = generateToken(payload, "1h");
    const refresh = generateToken(payload, "1d");
    res.cookie("xt-access-token", access);
    res.cookie("xt-refresh-token", refresh);
    res.json({ access, refresh });
    logger.debug(`generate new token for '${requester}'`);
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 500);
  }
});

router.get("/token-verify", (req, res) => {
  logger.info(req.method, req.originalUrl);

  authVerify(req)
    .then(({ token, refreshed }) => {
      if (refreshed) {
        logger.debug("token refreshed");
        res.cookie("xt-access-token", token);
        res.send("token refreshed");
      } else {
        logger.debug("token is valid");
        res.sendStatus(200);
      }
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = {
  router,
  parseToken,
  verify,
  authVerify,
};
