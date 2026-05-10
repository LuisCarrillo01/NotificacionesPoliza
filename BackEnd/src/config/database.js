const { Pool } = require('pg');
const environmentConfig = require('./env');

const databasePool = new Pool({
  connectionString: environmentConfig.databaseUrl,
  ssl: environmentConfig.databaseSsl ? { rejectUnauthorized: false } : false
});

async function executeQuery(queryText, queryParams = []) {
  return databasePool.query(queryText, queryParams);
}

module.exports = {
  databasePool,
  executeQuery
};
