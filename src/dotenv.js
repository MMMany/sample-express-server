const fs = require('fs');

const NODE_ENV = process.env.NODE_ENV || 'development';

const dotenvFiles = [
  '.env',
  NODE_ENV !== 'test' && '.env.local',
  `.env.${NODE_ENV}`,
  `.env.${NODE_ENV}.local`,
].filter(Boolean);

dotenvFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    require('dotenv-expand').expand(
      require('dotenv').config({
        path: file,
        override: true,
        debug: NODE_ENV !== 'production',
        quiet: NODE_ENV === 'production',
      }),
    );
  }
});
