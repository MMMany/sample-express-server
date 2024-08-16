const config = require("config");
const express = require("express");
const apiFileDownload = require("./routers/file-download").router;
const apiFileUpload = require("./routers/file-upload").router;
const apiAuth = require("./routers/auth").router;
const apiTestRequest = require("./routers/test-request").router;
const logger = require("./utils/logger");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();

const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/" + config.get("AppConfig.SESSION_DB_NAME"),
  collection: process.env.NODE_ENV,
});

store.on("error", (err) => {
  logger.error(err);
});

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "test",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(cors());
app.use(csrf({ cookie: true }));
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'");
  logger.debug(req.csrfToken());
  // set 'XSRF-TOKEN' cookie
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

[apiFileDownload, apiFileUpload, apiAuth, apiTestRequest].forEach((api) => {
  app.use("/v1", api);
});

app.get("/test", (req, res) => {
  logger.info(req.method, req.originalUrl);

  res.send("Hello " + JSON.stringify(req.session));
});

app.all("*", (req, res) => {
  logger.warn(`invalid access (${req.method} ${req.path})`);
  logger.debug(app.mountpath);
  res.sendStatus(404);
});

const PORT = config.get("AppConfig.PORT");
app.listen(PORT, () => {
  logger.debug(`Server is running on port ${PORT}`);
});
