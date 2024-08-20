const config = require("config");
const express = require("express");
const apiFileDownload = require("./routers/file-download").router;
const apiFileUpload = require("./routers/file-upload").router;
const apiAuth = require("./routers/auth").router;
const apiTestRequest = require("./routers/test-request").router;
const apiAppLogging = require('./routers/app-logging').router;
const logger = require("./utils/logger");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

const store = MongoStore.create({
  mongoUrl: "mongodb://localhost",
  dbName: "db_sessions",
  collectionName: process.env.NODE_ENV,
  stringify: false,
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
  // logger.debug(req.csrfToken());
  // set 'XSRF-TOKEN' cookie
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

const apiList = [apiFileDownload, apiFileUpload, apiAuth, apiTestRequest, apiAppLogging];
apiList.forEach((api) => {
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
