import config from "config";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Router } from "express";
import path from "path";
import { homedir } from "os";
import winston from "winston";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

const router = Router();
const home = homedir();
const logger = winston.loggers.get("was-logger");

const getSecretKey = () => {
  // if you want use private in project, use it.
  // return fs.readFileSync("./sample_private.key", "utf8");
  // return fs.readFileSync(path.join(homedir, ".ssh", process.env.PRIVATE_KEY_NAME));
  return fs.readFileSync(path.join(home, ".ssh", config.get("AppConfig.PRIVATE_KEY_NAME")));
};

const generateToken = (payload, expiresIn) => {
  return jwt.sign({ ...payload }, getSecretKey(), { expiresIn });
};

const parseBearer = async (req) => {
  // not used
  const authHeader = req.headers.authorization;
  return authHeader?.split(" ")[1];
};

const parseCookie = async (req) => {
  // not used
  return req.cookies["xt-access-token"];
};

const parseToken = async (req) => {
  // not used
  const authHeader = req.headers.authorization;
  return authHeader?.split(" ")[1] ?? req.cookies["xt-access-token"];
};

const verify = async (token) => {
  try {
    const decoded = jwt.verify(token, getSecretKey());
    // @ts-ignore
    return { ...decoded, expired: false };
  } catch (err) {
    if (err.message === "jwt expired") {
      return {
        // @ts-ignore
        ...jwt.verify(token, getSecretKey(), { ignoreExpiration: true }),
        expired: true,
      };
    } else if (err.message === "invalid token") {
      throw new UnauthorizedError(err.message);
    }
    throw err;
  }
};

export const authVerify = async (req) => {
  let token = req.session["xt-access-token"];
  if (!token) throw new UnauthorizedError();
  let refreshed = false;
  const decoded = await verify(token);
  if (decoded.expired) {
    // check refresh token
    logger.debug("refresh");
    const refreshToken = req.session["xt-refresh-token"];
    if (!refreshToken) throw new UnauthorizedError();
    if (await verify(refreshToken)) {
      const payload = {
        user: decoded.user,
        t: Date.now(),
      };
      token = generateToken(payload, "1h");
      req.session["xt-access-token"] = token;
      refreshed = true;
    }
  }
  return { token, refreshed };
};

/**
 * using session
 * set 'XSRF-TOKEN' cookie on 'index.js'
 * if you use 'postman' and use not 'GET' method, need to 'pre-request script'
 *
 * const jar = pm.cookie.jar()
 * jar.get('localhost', 'XSRF-TOKEN', (err, token) => {
 *   pm.request.headers.add({ key: 'X-XSRF-Token', value: token });
 * });
 */
router.get("/generate-token", (req, res) => {
  try {
    const requester = req.query.requester;
    // @ts-ignore
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
    req.session["xt-access-token"] = access;
    req.session["xt-refresh-token"] = refresh;
    res.json({ access, refresh });
    logger.debug(`generate new token for '${requester}'`);
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 500);
  }
});

router.get("/token-verify", (req, res) => {
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

export default router;
