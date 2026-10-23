const { z } = require('zod');
const AnomalyService = require('./anomaly.service');
const AIService = require('./ai.service');
const EmailService = require('./email.service');
const AlertModel = require('../models/alert.model');
const logger = require('../utils/logger');

// Single observation schema
const observationSchema = z.object({
  api_name: z.string().min(1, 'api_name is required'),
  response_time_ms: z.number().int().nonnegative('response_time_ms must be non-negative integer'),
  status_code: z.number().int().min(100).max(599, 'status_code must be between 100 and 599'),
  records_returned: z.number().int().nonnegative('records_returned must be non-negative integer')
});

// Batch observation schema (accepts single object or array)
const batchSchema = z.union([
  z.array(observationSchema),
  observationSchema.transform((item) => [item])
]);

class MonitoringService {
  /**
   * Process a batch of API observations
   * @param {Array<Object>|Object} data
   * @returns {Promise<{ success: boolean, processed: number, anomalies_detected: number, message: string, alerts: Array<Object> }>}
   */
  static async processObservations(data) {
    // 1. Validate Input
    const observations = batchSchema.parse(data);

    let anomaliesDetected = 0;
    const generatedAlerts = [];

    // 2. Process each observation synchronously/sequentially
    for (const obs of observations) {
      try {
        const anomaly = AnomalyService.analyze(obs);

        if (anomaly) {
          anomaliesDetected++;
          logger.info(`Anomaly detected on ${obs.api_name}: ${anomaly.anomaly_type} (${anomaly.severity})`);

          // 3. Generate AI explanation
          const message = await AIService.generateAlertExplanation({
            api_name: obs.api_name,
            response_time_ms: obs.response_time_ms,
            status_code: obs.status_code,
            records_returned: obs.records_returned,
            anomaly_type: anomaly.anomaly_type,
            severity: anomaly.severity,
            issues: anomaly.issues
          });

          // 4. Save to SQLite database
          const savedAlert = AlertModel.create({
            api_name: obs.api_name,
            response_time_ms: obs.response_time_ms,
            status_code: obs.status_code,
            records_returned: obs.records_returned,
            anomaly_type: anomaly.anomaly_type,
            severity: anomaly.severity,
            message,
            status: 'ACTIVE'
          });

          // 5. Email service sends notification
          await EmailService.sendAlertNotification(savedAlert).catch((err) => {
            logger.warn(`Failed to dispatch email for ${obs.api_name}: ${err.message}`);
          });

          generatedAlerts.push(savedAlert);
        }
      } catch (err) {
        logger.error(`Error processing observation for ${obs.api_name}:`, err);
      }
    }

    return {
      success: true,
      processed: observations.length,
      anomalies_detected: anomaliesDetected,
      message: 'Monitoring completed',
      alerts: generatedAlerts
    };
  }
}

module.exports = MonitoringService;
