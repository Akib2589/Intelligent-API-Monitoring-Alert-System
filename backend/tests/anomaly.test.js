const { test, describe } = require('node:test');
const assert = require('node:assert');
const AnomalyService = require('../src/services/anomaly.service');

describe('AnomalyService Tests', () => {
  test('detects HTTP 500 server error as HIGH severity HTTP_ERROR', () => {
    const observation = {
      api_name: 'AppointmentAPI',
      response_time_ms: 5500,
      status_code: 500,
      records_returned: 0
    };

    const anomaly = AnomalyService.analyze(observation);
    assert.ok(anomaly !== null);
    assert.strictEqual(anomaly.is_anomaly, true);
    assert.strictEqual(anomaly.anomaly_type, 'HTTP_ERROR');
    assert.strictEqual(anomaly.severity, 'HIGH');
  });

  test('detects high latency (>3000ms) on 200 OK as HIGH severity HIGH_LATENCY', () => {
    const observation = {
      api_name: 'PatientRecordsAPI',
      response_time_ms: 3400,
      status_code: 200,
      records_returned: 150
    };

    const anomaly = AnomalyService.analyze(observation);
    assert.ok(anomaly !== null);
    assert.strictEqual(anomaly.is_anomaly, true);
    assert.strictEqual(anomaly.anomaly_type, 'HIGH_LATENCY');
    assert.strictEqual(anomaly.severity, 'HIGH');
  });

  test('detects zero records returned on 200 OK as ZERO_RECORDS anomaly', () => {
    const observation = {
      api_name: 'InventorySearchAPI',
      response_time_ms: 210,
      status_code: 200,
      records_returned: 0
    };

    const anomaly = AnomalyService.analyze(observation);
    assert.ok(anomaly !== null);
    assert.strictEqual(anomaly.is_anomaly, true);
    assert.strictEqual(anomaly.anomaly_type, 'ZERO_RECORDS');
    assert.strictEqual(anomaly.severity, 'MEDIUM');
  });

  test('returns null for healthy API observation', () => {
    const observation = {
      api_name: 'AuthService',
      response_time_ms: 145,
      status_code: 200,
      records_returned: 1
    };

    const anomaly = AnomalyService.analyze(observation);
    assert.strictEqual(anomaly, null);
  });
});
