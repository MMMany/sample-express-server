import mongodb from "mongodb";

const HOST = "localhost";
const DB_NAME = "db_data";
const client = new mongodb.MongoClient(`mongodb://${HOST}`);

/** @type {mongodb.Db} */
let db = null;

export const getDbInstance = async () => {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("database connected");
  }
  return db;
};

export const closeDbInstance = async () => {
  await client.close();
  console.log("database disconnected");
  process.exit(0);
};

["SIGINT", "SIGTERM", "SIGQUIT", "SIGHUP"].forEach((sig) => {
  process.on(sig, closeDbInstance);
});
