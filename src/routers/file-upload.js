import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import multer, { diskStorage } from "multer";
import { getSecretKey, parseBearerToken } from "./auth.js";
import { Router } from "express";
import jwt from "jsonwebtoken";

const apiFileUpload = Router();

const storage = diskStorage({
  destination: (req, file, cb) => {
    console.log("destination: ", uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    console.log("filename: ", `${Date.now()}-${file.originalname}`);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

apiFileUpload.post("/upload", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");

    upload.single("file")(req, res, (err) => {
      if (err) return res.status(500).send("File upload failed");

      console.log("Uploaded file: ", req.file);
      console.log("Data: ", req.body);

      res.status(200).send("File uploaded successfully");
    });
  });
});

export default apiFileUpload;

export const uploadPath = (() => {
  const path = join(process.cwd(), "uploads");
  if (!existsSync(path)) mkdirSync(path);
  return path;
})();
