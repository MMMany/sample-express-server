const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

let db;

const connectDB = async () => {
  if (db) return db;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(); // If dbName is in URI, it uses it, otherwise specify here
    return db;
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const disconnectDB = async () => {
  await client.close();
};

module.exports = { connectDB, getDb, client, disconnectDB };
