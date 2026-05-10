const express = require('express');
const cors = require('cors');
const environmentConfig = require('./config/env');
const apiRouter = require('./routes');
const errorHandler = require('./shared/middlewares/errorHandler.middleware');
const notFoundMiddleware = require('./shared/middlewares/notFound.middleware');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || environmentConfig.corsAllowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (environmentConfig.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    }
  })
);

app.use(express.json());

app.get('/health', (request, response) => {
  response.status(200).json({
    status: 'ok',
    environment: environmentConfig.nodeEnvironment
  });
});

app.use('/api', apiRouter);

app.use(notFoundMiddleware);
app.use(errorHandler);

module.exports = app;
