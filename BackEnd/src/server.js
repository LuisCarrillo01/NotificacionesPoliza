const app = require('./app');
const environmentConfig = require('./config/env');
const { databasePool } = require('./config/database');

async function startServer() {
  try {
    await databasePool.query('SELECT 1');

    app.listen(environmentConfig.port, () => {
      console.log(`Server running on port ${environmentConfig.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
