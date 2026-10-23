const app = require('./app');
const env = require('./config/env');
const { initDatabase, closeDatabase } = require('./config/database');
const logger = require('./utils/logger');

// Initialize database
initDatabase();

const server = app.listen(env.PORT, () => {
  logger.info(`Intelligent API Monitor backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Health check: http://localhost:${env.PORT}/health`);
  logger.info(`Alerts endpoint: http://localhost:${env.PORT}/alerts`);
  logger.info(`Monitor endpoint: http://localhost:${env.PORT}/monitor`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDatabase();
    logger.info('HTTP server and Database closed.');
    process.exit(0);
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = server;
