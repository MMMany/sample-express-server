const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

require("dotenv").config();

const app = express();
const port = process.env.WAS_PORT;

function getSecretKey() {
  return fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
}

const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
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

function parseBearerToken(req) {
  const authHeader = req.headers["authorization"];
  return authHeader && authHeader.split(" ")[1];
}

app.get("/generate-token", (req, res) => {
  const token = jwt.sign({}, getSecretKey(), { expiresIn: "1h" });
  res.json({ token });
});

app.get("/token-verify", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");
    res.status(200).send("Token is valid");
  });
});

app.get("/download", (req, res) => {
  const token = parseBearerToken(req);

  if (!token) return res.status(400).send("Token is required");

  jwt.verify(token, getSecretKey(), (err) => {
    if (err) return res.status(401).send("Invalid or expired token");

    const filePath = req.query.file;

    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    res.download(filePath);
  });
});

app.post("/upload", (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
