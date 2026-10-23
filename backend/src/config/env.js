const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend folder or root folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_PATH: process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.resolve(__dirname, '../../data/monitoring.db'),
  AI_PROVIDER: 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-3.5-flash-lite',
  LATENCY_HIGH_THRESHOLD_MS: parseInt(process.env.LATENCY_HIGH_THRESHOLD_MS, 10) || 3000,
  LATENCY_WARN_THRESHOLD_MS: parseInt(process.env.LATENCY_WARN_THRESHOLD_MS, 10) || 1500,

  // Optional Email Notification Service
  EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'true' || Boolean(process.env.EMAIL_USER),
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"API Monitor" <alerts@apimonitor.local>',
  ALERT_RECIPIENT_EMAIL: process.env.ALERT_RECIPIENT_EMAIL || 'sre-alerts@example.com',
};

module.exports = env;
