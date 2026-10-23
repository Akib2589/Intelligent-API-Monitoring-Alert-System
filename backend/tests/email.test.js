const { test, describe } = require('node:test');
const assert = require('node:assert');
const EmailService = require('../src/services/email.service');

describe('EmailService Notification Tests', () => {
  test('dispatches simulated email notification when SMTP is not configured', async () => {
    const mockAlert = {
      id: 99,
      api_name: 'PaymentCheckoutAPI',
      response_time_ms: 5200,
      status_code: 504,
      records_returned: 0,
      anomaly_type: 'HTTP_ERROR',
      severity: 'HIGH',
      message: 'PaymentCheckoutAPI timed out with 504 Gateway Timeout. User transactions failed.',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    const result = await EmailService.sendAlertNotification(mockAlert);
    assert.strictEqual(result, true);
  });

  test('generates valid HTML template with incident metrics and AI summary', () => {
    const mockAlert = {
      id: 101,
      api_name: 'SearchAPI',
      response_time_ms: 4500,
      status_code: 500,
      records_returned: 0,
      anomaly_type: 'HTTP_ERROR',
      severity: 'HIGH',
      message: 'SearchAPI encountered a 500 server error.',
      status: 'ACTIVE'
    };

    const html = EmailService._generateHtmlTemplate(mockAlert);
    assert.ok(html.includes('SearchAPI'));
    assert.ok(html.includes('HIGH'));
    assert.ok(html.includes('4500 ms'));
    assert.ok(html.includes('500'));
    assert.ok(html.includes('SearchAPI encountered a 500 server error.'));
  });
});
