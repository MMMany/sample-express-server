import { existsSync } from "fs";
import { getSecretKey, parseBearerToken } from "./auth.js";
import { Router } from "express";
import jwt from "jsonwebtoken";

const apiFileDownload = Router();

apiFileDownload.get("/download", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");

    const filePath = req.query.file;

    if (!existsSync(filePath)) return res.status(404).send("File not found");

    res.download(filePath);
  });
});

export default apiFileDownload;
