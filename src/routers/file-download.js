const fs = require("fs");
const auth = require("./auth");
const Router = require("express").Router;
const jwt = require("jsonwebtoken");

const apiFileDownload = Router();

apiFileDownload.get("/download", (req, res) => {
  const token = auth.parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, auth.getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");

    const filePath = req.query.file;

    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    res.download(filePath);
  });
});

module.exports = {
  router: apiFileDownload,
}