const dotenv = require('dotenv');

dotenv.config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

function parseNumber(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid numeric environment value: ${value}`);
  }

  return parsedValue;
}

function getRequiredEnvironmentVariable(variableName) {
  const environmentValue = process.env[variableName];

  if (!environmentValue) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }

  return environmentValue;
}

const environmentConfig = {
  nodeEnvironment: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),
  apiBaseUrl: getRequiredEnvironmentVariable('API_BASE_URL'),
  databaseUrl: getRequiredEnvironmentVariable('DATABASE_URL'),
  databaseSsl: parseBoolean(process.env.DATABASE_SSL, false),
  jwtSecret: getRequiredEnvironmentVariable('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  validationAgentBaseUrl: getRequiredEnvironmentVariable('VALIDATION_AGENT_BASE_URL'),
  validationAgentValidatePath: getRequiredEnvironmentVariable('VALIDATION_AGENT_VALIDATE_PATH'),
  validationAgentTimeoutMs: parseNumber(process.env.VALIDATION_AGENT_TIMEOUT_MS, 10000),
  validationResultCallbackToken: process.env.VALIDATION_RESULT_CALLBACK_TOKEN || '',
  bcryptSaltRounds: parseNumber(process.env.BCRYPT_SALT_ROUNDS, 10),
  defaultPageSize: parseNumber(process.env.DEFAULT_PAGE_SIZE, 10),
  maxPageSize: parseNumber(process.env.MAX_PAGE_SIZE, 100),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = environmentConfig;
