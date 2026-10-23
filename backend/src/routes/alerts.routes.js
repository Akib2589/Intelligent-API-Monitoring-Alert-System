const express = require('express');
const AlertsController = require('../controllers/alerts.controller');

const router = express.Router();

router.get('/', AlertsController.getAlerts);
router.get('/stats', AlertsController.getStats);
router.patch('/:id/status', AlertsController.updateStatus);
router.delete('/', AlertsController.clearAlerts);

module.exports = router;
