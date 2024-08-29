const router = require("express").Router();
const Notice = require("../models/Notice");
const logger = require("winston").loggers.get("was-logger");
const { NoContentError, BadRequestError, RequestTimeoutError } = require("../utils/errors");
const _ = require("lodash");
const { Mutex, withTimeout } = require("async-mutex");
const mongoose = require("mongoose");

const mutex = withTimeout(new Mutex(), 30 * 1000, new RequestTimeoutError());

const parseNoticeId = (id) => {
  const ret = +id;
  if (!ret || ret < 1) {
    return null;
  }
  return ret;
};

const parseString = (text) => {
  let ret = text;
  if (!_.isString(ret)) {
    return null;
  }
  ret = text.trim();
  if (_.isEmpty(ret)) {
    return null;
  }
  return ret;
};

const removePrivateData = (mongoDocument) => {
  if (_.isArray(mongoDocument)) {
    return mongoDocument.map((it) => removePrivateData(it));
  } else {
    const ret = { ...mongoDocument.toObject() };
    delete ret._id;
    delete ret.__v;
    return ret;
  }
};

const createObjectId = () => {
  return mongoose.Types.ObjectId.createFromTime(Date.now());
};

// ============================== API ==============================

// Create one
router.post("/notice", (req, res) => {
  let { title, contents } = req.body;
  try {
    title = parseString(title);
    contents = parseString(contents);
    if (!title || !contents) {
      throw new BadRequestError("invalid data");
    }
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 400);
    return;
  }

  mutex
    .runExclusive(async () => {
      if (await Notice.findOne({ title })) {
        throw new BadRequestError("title duplicated");
      }

      const lastNoticeId = (await Notice.findOne({}, { noticeId: 1 }).limit(1).sort({ noticeId: -1 }))?.noticeId;
      const newNotice = await Notice.create({
        noticeId: (lastNoticeId ?? 0) + 1,
        title,
        contents,
      });

      const ret = removePrivateData(newNotice);
      logger.info(`Created\n${JSON.stringify(ret, null, 2)}`);
      res.json(ret);
    })
    .catch((err) => {
      logger.error(err.message);
      if (err.code || err.reason?.code) {
        // mongodb error
        res.sendStatus(400);
      } else {
        res.sendStatus(err.status ?? 500);
      }
    });
});

// Read all
router.get("/notice", (req, res) => {
  Notice.find({ isDeleted: false })
    .sort({ noticeId: -1 })
    .then((result) => {
      const ret = removePrivateData(result);
      logger.info("Response OK");
      logger.debug(`count : ${ret.length}`);
      res.json(ret);
    })
    .catch((err) => {
      logger.error(err.message);
      if (err.code || err.reason?.code) {
        // mongodb error
        res.sendStatus(400);
      } else {
        res.sendStatus(err.status ?? 500);
      }
    });
});

// Read one
router.get("/notice/:noticeId", (req, res) => {
  const noticeId = parseNoticeId(req.params.noticeId);
  if (!noticeId) {
    logger.error("invalid notice-id");
    res.sendStatus(400);
    return;
  }

  Notice.findOneAndUpdate(
    {
      noticeId,
      isDeleted: false,
    },
    {
      $inc: { readCount: 1 },
    },
    {
      returnOriginal: false,
    }
  )
    .then((result) => {
      if (!result) {
        throw new BadRequestError("no content");
      }
      const ret = removePrivateData(result);
      logger.info("Response OK");
      logger.debug(`Notice#${ret.noticeId}.readCount : ${ret.readCount}`);
      res.json(ret);
    })
    .catch((err) => {
      logger.error(err.message);
      if (err.code || err.reason?.code) {
        // mongodb error
        res.sendStatus(400);
      } else {
        res.sendStatus(err.status ?? 500);
      }
    });
});

// Update one
router.patch("/notice/:noticeId", (req, res) => {
  const noticeId = parseNoticeId(req.params.noticeId);
  let { title, contents } = req.body;
  try {
    if (!noticeId) {
      throw new BadRequestError("invalid notice-id");
    }

    title = parseString(title);
    contents = parseString(contents);
    if (!title && !contents) {
      throw new BadRequestError("invalid data");
    }
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 400);
    return;
  }

  mutex
    .runExclusive(async () => {
      if (await Notice.findOne({ title })) {
        throw new BadRequestError("title duplicated");
      }

      const meta = { $set: {} };
      if (title) {
        meta.$set.title = title;
      }
      if (contents) {
        meta.$set.contents = contents;
      }

      const result = await Notice.findOneAndUpdate(
        {
          noticeId,
        },
        meta,
        {
          returnOriginal: false,
        }
      );

      const ret = removePrivateData(result);
      logger.info("Response OK");
      res.json(ret);
    })
    .catch((err) => {
      logger.error(err.message);
      if (err.code || err.reason?.code) {
        // mongodb error
        res.sendStatus(400);
      } else {
        res.sendStatus(err.status ?? 500);
      }
    });
});

// Delete one
router.delete("/notice/:noticeId", (req, res) => {
  const noticeId = parseNoticeId(req.params.noticeId);
  if (!noticeId) {
    logger.error("invalid notice-id");
    res.sendStatus(400);
    return;
  }

  mutex
    .runExclusive(async () => {
      const exist = await Notice.findOne({ noticeId });
      const result = await Notice.findOneAndUpdate(
        { noticeId },
        {
          $set: {
            title: `${exist.title} (${createObjectId()})`,
            isDeleted: true,
          },
        },
        { returnOriginal: false }
      );

      const ret = removePrivateData(result);
      logger.info(`Deleted\n${JSON.stringify(ret, null, 2)}`);
      res.json(ret);
    })
    .catch((err) => {
      logger.error(err.message);
      if (err.code || err.reason?.code) {
        // mongodb error
        res.sendStatus(400);
      } else {
        res.sendStatus(err.status ?? 500);
      }
    });
});

module.exports = { router };
