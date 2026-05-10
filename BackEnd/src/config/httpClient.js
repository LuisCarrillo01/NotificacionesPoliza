const axios = require('axios');
const environmentConfig = require('./env');

const validationAgentClient = axios.create({
  baseURL: environmentConfig.validationAgentBaseUrl,
  timeout: environmentConfig.validationAgentTimeoutMs,
  headers: {
    'Content-Type': 'application/json'
  }
});

module.exports = {
  validationAgentClient
};
