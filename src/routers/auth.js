const jwt = require("jsonwebtoken");
const fs = require("fs");
const Router = require("express").Router;
const path = require("path");
const homedir = require("os").homedir();

function getSecretKey() {
  // return fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
  return fs.readFileSync(path.join(homedir, ".ssh", process.env.PRIVATE_KEY_NAME));
}

function parseBearerToken(req) {
  const authHeader = req.headers["authorization"];
  return authHeader && authHeader.split(" ")[1];
}

function debug(req, message) {
  console.debug(`${req.url} : ${message}`);
}

const apiAuth = Router();

apiAuth.get("/generate-token", (req, res) => {
  try {
    const requester = req.body.requester;
    if (!requester || requester.trim().length === 0) {
      debug(req, "There is no 'requester' in body");
      res.status(400).send("Bad Request");
      return;
    }
    const token = jwt.sign({}, getSecretKey(), { expiresIn: "1d" });
    res.json({ token });
    debug(req, `Generate new token for '${requester}'`);
  } catch (err) {
    console.error(err);
    res.status(400).send("Bad Request");
  }
});

apiAuth.get("/token-verify", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) {
    debug(req, "Token is empty");
    return res.status(400).send("Bad Request");
  }

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) {
      debug(req, "Invalid token");
      return res.status(401).send("Invalid token");
    }
    res.status(200).send("Token is valid");
    debug(req, "Token is valid");
  });
});

module.exports = {
  router: apiAuth,
  getSecretKey,
  parseBearerToken,
};
