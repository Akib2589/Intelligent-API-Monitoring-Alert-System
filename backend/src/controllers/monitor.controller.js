const MonitoringService = require('../services/monitoring.service');

class MonitorController {
  /**
   * POST /monitor
   * Receives API response observations and processes anomalies.
   */
  static async processBatch(req, res, next) {
    try {
      const result = await MonitoringService.processObservations(req.body);
      return res.status(200).json({
        success: result.success,
        processed: result.processed,
        anomalies_detected: result.anomalies_detected,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MonitorController;
