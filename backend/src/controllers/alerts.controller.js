const AlertModel = require('../models/alert.model');

class AlertsController {
  /**
   * GET /alerts
   * Fetch alerts from SQLite (supports optional ?status= query filter, defaults to ACTIVE)
   */
  static async getAlerts(req, res, next) {
    try {
      const { status } = req.query;
      let alerts;

      if (status === 'ALL') {
        alerts = AlertModel.findAll();
      } else if (status) {
        alerts = AlertModel.findByStatus(status.toUpperCase());
      } else {
        // Default to active alerts as specified in the architecture document
        alerts = AlertModel.findActive();
      }

      return res.status(200).json({
        success: true,
        alerts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /alerts/stats
   * Returns aggregated statistics for dashboard summary cards
   */
  static async getStats(req, res, next) {
    try {
      const stats = AlertModel.getStats();
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /alerts/:id/status
   * Update status of an alert (e.g. resolve)
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status required: ACTIVE, RESOLVED, or ACKNOWLEDGED'
        });
      }

      const updated = AlertModel.updateStatus(Number(id), status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Alert ${id} marked as ${status}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /alerts
   * Clear alerts (useful for testing & resets)
   */
  static async clearAlerts(req, res, next) {
    try {
      AlertModel.clearAll();
      return res.status(200).json({
        success: true,
        message: 'All alerts cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AlertsController;
