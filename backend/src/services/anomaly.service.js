const env = require('../config/env');

class AnomalyService {
  /**
   * Analyzes an API observation and returns anomaly details if detected.
   * @param {Object} observation
   * @param {string} observation.api_name
   * @param {number} observation.response_time_ms
   * @param {number} observation.status_code
   * @param {number} observation.records_returned
   * @returns {Object|null} Anomaly result or null if healthy
   */
  static analyze(observation) {
    const { api_name, response_time_ms, status_code, records_returned } = observation;
    const issues = [];
    let primaryAnomalyType = null;
    let maxSeverityWeight = 0; // 1: LOW, 2: MEDIUM, 3: HIGH

    // 1. Check HTTP Status
    if (status_code >= 500) {
      issues.push(`Server error with HTTP ${status_code}`);
      primaryAnomalyType = primaryAnomalyType || 'HTTP_ERROR';
      maxSeverityWeight = Math.max(maxSeverityWeight, 3); // HIGH
    } else if (status_code >= 400) {
      issues.push(`Client/Service error with HTTP ${status_code}`);
      primaryAnomalyType = primaryAnomalyType || 'HTTP_ERROR';
      // 429 rate limit or 5xx are higher severity than regular 404
      const weight = (status_code === 429 || status_code === 401 || status_code === 403) ? 2 : 2;
      maxSeverityWeight = Math.max(maxSeverityWeight, weight);
    }

    // 2. Check Latency
    if (response_time_ms >= env.LATENCY_HIGH_THRESHOLD_MS) {
      issues.push(`Critical response latency of ${response_time_ms}ms (threshold: ${env.LATENCY_HIGH_THRESHOLD_MS}ms)`);
      primaryAnomalyType = primaryAnomalyType || 'HIGH_LATENCY';
      maxSeverityWeight = Math.max(maxSeverityWeight, 3); // HIGH
    } else if (response_time_ms >= env.LATENCY_WARN_THRESHOLD_MS) {
      issues.push(`Elevated response latency of ${response_time_ms}ms (threshold: ${env.LATENCY_WARN_THRESHOLD_MS}ms)`);
      primaryAnomalyType = primaryAnomalyType || 'HIGH_LATENCY';
      maxSeverityWeight = Math.max(maxSeverityWeight, 2); // MEDIUM
    }

    // 3. Check Returned Records
    // Flag when successful HTTP 2xx returns 0 records (potential empty dataset / silent data drops)
    // or when combined with error states
    if (records_returned === 0 && status_code >= 200 && status_code < 300) {
      issues.push('API returned 0 records on successful status');
      primaryAnomalyType = primaryAnomalyType || 'ZERO_RECORDS';
      maxSeverityWeight = Math.max(maxSeverityWeight, 2); // MEDIUM
    } else if (records_returned === 0 && status_code >= 400) {
      issues.push('No records returned due to error state');
    }

    // If no issues found, observation is healthy
    if (issues.length === 0) {
      return null;
    }

    // Resolve severity string
    let severity = 'LOW';
    if (maxSeverityWeight >= 3) {
      severity = 'HIGH';
    } else if (maxSeverityWeight === 2) {
      severity = 'MEDIUM';
    }

    return {
      is_anomaly: true,
      anomaly_type: primaryAnomalyType || 'HTTP_ERROR',
      severity,
      issues,
      observation
    };
  }
}

module.exports = AnomalyService;
