import mongodb from "mongodb";
import { getDbInstance } from "./MongoDB";
import collectionNames from "./collectionNames";

/**
 * find a document via given collection name
 * @param {string} collectionName
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
async function _find(collectionName, filter = {}, options = {}) {
  if (!Object.keys(collectionNames).includes(collectionName)) {
    throw new Error("invalid collection name");
  }
  const db = await getDbInstance();
  const collection = db.collection(collectionName);
  return await collection.find(filter, options).toArray();
}

/**
 * find one document via given collection name
 * @param {string} collectionName
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
const _findOne = async (collectionName, filter = {}, options = {}) => {
  if (!Object.keys(collectionNames).includes(collectionName)) {
    throw new Error("invalid collection name");
  }
  const db = await getDbInstance();
  const collection = db.collection(collectionName);
  return await collection.findOne(filter, options);
};

/**
 * find a notice from db
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
export const mongoNoticeFind = async (filter = {}, options = {}) => {
  return await _find(collectionNames.NOTICE, filter, options);
};

/**
 * find one notice from db
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
export const mongoNoticeFindOne = async (filter = {}, options = {}) => {
  return await _findOne(collectionNames.NOTICE, filter, options);
};

/**
 * find a user from db
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
export const mongoUserFind = async (filter = {}, options = {}) => {
  return await _find(collectionNames.USERS, filter, options);
};

/**
 * find one user from db
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
export const mongoUserFindOne = async (filter = {}, options = {}) => {
  return await _findOne(collectionNames.USERS, filter, options);
};
