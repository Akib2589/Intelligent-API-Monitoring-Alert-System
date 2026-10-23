const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const monitorRoutes = require('./routes/monitor.routes');
const alertsRoutes = require('./routes/alerts.routes');
const errorHandler = require('./middleware/error-handler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Request logging (omit in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Mount Routes
app.use('/monitor', monitorRoutes);
app.use('/alerts', alertsRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
