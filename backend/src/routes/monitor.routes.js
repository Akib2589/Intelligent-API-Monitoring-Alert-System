const express = require('express');
const MonitorController = require('../controllers/monitor.controller');

const router = express.Router();

router.post('/', MonitorController.processBatch);

module.exports = router;
