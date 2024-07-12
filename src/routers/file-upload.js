const path = require("path");
const fs = require("fs");
const multer = require("multer");
const auth = require("./auth");
const Router = require("express").Router;
const jwt = require("jsonwebtoken");

const apiFileUpload = Router();

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

const uploadPath = (() => {
  const ret = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(ret)) fs.mkdirSync(ret);
  return ret;
})();

module.exports = {
  router: apiFileUpload,
  uploadPath,
}
