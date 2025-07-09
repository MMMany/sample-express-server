require('./dotenv');
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const downloadsRouter = require('./routers/downloads');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Statically serve the uploads directory
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));
app.use('/api/downloads', downloadsRouter);

let server;
// Connect to DB and then start the server, unless in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });

      const gracefulShutdown = () => {
        console.log('Received kill signal, shutting down gracefully.');
        const { client } = require('./db');
        const shutdownTimeout = setTimeout(() => {
          console.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000); // 10 seconds

        server.close(() => {
          console.log('Closed out remaining connections.');
          client.close().then(() => {
            console.log('MongoDB connection closed.');
            clearTimeout(shutdownTimeout);
            process.exit(0);
          });
        });
      };

      // listen for TERM signal .e.g. kill
      process.on('SIGTERM', gracefulShutdown);

      // listen for INT signal e.g. Ctrl-C
      process.on('SIGINT', gracefulShutdown);
    })
    .catch((err) => {
      console.error('Failed to start the server', err);
      process.exit(1);
    });
}

module.exports = { app };
