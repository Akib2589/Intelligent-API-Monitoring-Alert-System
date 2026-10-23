const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');
const logger = require('../utils/logger');

let db = null;

function initDatabase(customPath) {
  const dbPath = customPath || env.DATABASE_PATH;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrency performance
  db.pragma('journal_mode = WAL');

  // Schema creation
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_name TEXT NOT NULL,
        response_time_ms INTEGER NOT NULL,
        status_code INTEGER NOT NULL,
        records_returned INTEGER NOT NULL,
        anomaly_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_api_name ON alerts(api_name);
  `;

  db.exec(createTableQuery);
  logger.info(`Database connected and initialized at: ${dbPath}`);

  return db;
}

function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
