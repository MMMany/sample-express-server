// configuration
const config = require("config");
require("./utils/logger");

// packages
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const logger = require("winston").loggers.get("was-logger");

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

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
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

const apiList = [
  require("./routers/file-download").router,
  require("./routers/file-upload").router,
  require("./routers/auth").router,
  require("./routers/test-request").router,
  require("./routers/app-logging").router,
  require("./routers/notice").router,
];
apiList.forEach((api) => {
  app.use("/v1", api);
});

// ===== test =====
app.get("/test", (req, res) => {
  res.sendStatus(200);
});
// ===== test =====

app.all("*", (req, res) => {
  logger.warn(`invalid access (${req.method} ${req.originalUrl})`);
  res.sendStatus(404);
});

const PORT = config.get("AppConfig.PORT");
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}
mongoose
  .connect("mongodb://localhost/db_data")
  .then(() => {
    logger.debug("database connected");
    app.listen(PORT, () => {
      logger.debug(`server is running on ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(err.message);
  });
