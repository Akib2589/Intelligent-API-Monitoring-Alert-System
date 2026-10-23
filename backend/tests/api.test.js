const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { initDatabase, closeDatabase } = require('../src/config/database');
const AlertModel = require('../src/models/alert.model');
const AIService = require('../src/services/ai.service');

const TEST_DB_PATH = path.resolve(__dirname, '../data/test-monitoring.db');

describe('API Endpoints Integration Tests', () => {
  before(() => {
    // Mock AI service to avoid real network calls during tests
    AIService.generateAlertExplanation = async (data) => {
      return `${data.api_name} failed with status ${data.status_code} and returned zero records. A service outage may have occurred.`;
    };

    // Initialize with a clean test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    initDatabase(TEST_DB_PATH);
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        // Ignore unlink error on cleanup
      }
    }
  });

  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('POST /monitor with valid anomalous input detects anomaly and saves alert', async () => {
    const payload = [
      {
        api_name: 'AppointmentAPI',
        response_time_ms: 5500,
        status_code: 500,
        records_returned: 0
      }
    ];

    const res = await request(app)
      .post('/monitor')
      .send(payload)
      .set('Content-Type', 'application/json');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.processed, 1);
    assert.strictEqual(res.body.anomalies_detected, 1);
    assert.strictEqual(res.body.message, 'Monitoring completed');
  });

  test('POST /monitor with invalid input returns 400 Bad Request with validation details', async () => {
    const invalidPayload = [
      {
        api_name: '',
        response_time_ms: -50,
        status_code: 999,
        records_returned: -1
      }
    ];

    const res = await request(app)
      .post('/monitor')
      .send(invalidPayload);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Validation Error');
  });

  test('GET /alerts returns active alerts from SQLite', async () => {
    const res = await request(app).get('/alerts');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.alerts));
    assert.strictEqual(res.body.alerts.length, 1);
    
    const alert = res.body.alerts[0];
    assert.strictEqual(alert.api_name, 'AppointmentAPI');
    assert.strictEqual(alert.status_code, 500);
    assert.strictEqual(alert.records_returned, 0);
    assert.strictEqual(alert.anomaly_type, 'HTTP_ERROR');
    assert.strictEqual(alert.severity, 'HIGH');
    assert.strictEqual(alert.status, 'ACTIVE');
    assert.ok(alert.message.length > 0);
  });

  test('GET /alerts/stats returns aggregated metrics', async () => {
    const res = await request(app).get('/alerts/stats');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.stats.active_alerts, 1);
    assert.strictEqual(res.body.stats.high_severity_alerts, 1);
    assert.strictEqual(res.body.stats.monitored_apis, 1);
  });

  test('PATCH /alerts/:id/status updates status to RESOLVED', async () => {
    const alertsRes = await request(app).get('/alerts');
    const alertId = alertsRes.body.alerts[0].id;

    const updateRes = await request(app)
      .patch(`/alerts/${alertId}/status`)
      .send({ status: 'RESOLVED' });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.success, true);

    // Verify GET /alerts now returns 0 active alerts
    const activeRes = await request(app).get('/alerts');
    assert.strictEqual(activeRes.body.alerts.length, 0);

    // Verify GET /alerts?status=ALL still returns it
    const allRes = await request(app).get('/alerts?status=ALL');
    assert.strictEqual(allRes.body.alerts.length, 1);
    assert.strictEqual(allRes.body.alerts[0].status, 'RESOLVED');
  });
});
