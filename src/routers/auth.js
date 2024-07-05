import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { Router } from "express";

export function getSecretKey() {
  return readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
}

export function parseBearerToken(req) {
  const authHeader = req.headers["authorization"];
  return authHeader && authHeader.split(" ")[1];
}

const apiAuth = Router();

apiAuth.get("/generate-token", (req, res) => {
  const token = jwt.sign({}, getSecretKey(), { expiresIn: "1h" });
  res.json({ token });
});

apiAuth.get("/token-verify", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");
    res.status(200).send("Token is valid");
  });
});

export default apiAuth;
