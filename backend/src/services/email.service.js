const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

class EmailService {
  /**
   * Initializes or returns the nodemailer transporter
   */
  static getTransporter() {
    if (!transporter && env.EMAIL_HOST && env.EMAIL_USER) {
      transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS
        }
      });
    }
    return transporter;
  }

  /**
   * Sends an email notification for a detected anomaly
   * @param {Object} alert
   * @returns {Promise<boolean>}
   */
  static async sendAlertNotification(alert) {
    const subject = `[${alert.severity} ALERT] Anomaly Detected on ${alert.api_name} (${alert.anomaly_type})`;

    // Check if live SMTP is configured and enabled
    if (env.EMAIL_ENABLED && env.EMAIL_HOST && env.EMAIL_USER) {
      try {
        const mail = this.getTransporter();
        const html = this._generateHtmlTemplate(alert);
        const text = `ANOMALY ALERT: ${alert.api_name}\nSeverity: ${alert.severity}\nType: ${alert.anomaly_type}\nLatency: ${alert.response_time_ms}ms\nStatus: ${alert.status_code}\nRecords: ${alert.records_returned}\n\nAI Explanation:\n${alert.message}`;

        const info = await mail.sendMail({
          from: env.EMAIL_FROM,
          to: env.ALERT_RECIPIENT_EMAIL,
          subject,
          text,
          html
        });

        logger.info(`Email alert dispatched for ${alert.api_name} (Message ID: ${info.messageId}) to ${env.ALERT_RECIPIENT_EMAIL}`);
        return true;
      } catch (err) {
        logger.error(`Failed to send email alert for ${alert.api_name}:`, err.message);
        return false;
      }
    }

    // Default: Log simulated email notification if SMTP is not configured
    logger.info(`[EMAIL SIMULATED] Alert notification queued:
  To: ${env.ALERT_RECIPIENT_EMAIL}
  Subject: ${subject}
  API: ${alert.api_name} (Status: ${alert.status_code}, Latency: ${alert.response_time_ms}ms)
  AI Summary: ${alert.message}`);
    return true;
  }

  /**
   * Generates a clean HTML email template for incident notification
   */
  static _generateHtmlTemplate(alert) {
    const severityColor = alert.severity === 'HIGH' ? '#e11d48' : alert.severity === 'MEDIUM' ? '#d97706' : '#2563eb';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: #1e1b4b; padding: 20px; border-bottom: 2px solid ${severityColor};">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: ${severityColor}; color: #ffffff; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
            ${alert.severity} Severity Alert
          </span>
          <h2 style="margin: 0; font-size: 20px; color: #ffffff;">Incident Detected: ${alert.api_name}</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Type: ${alert.anomaly_type} • ID: #${alert.id || 'N/A'}</p>
        </div>

        <div style="padding: 24px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #1e293b; padding: 14px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <div>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Response Time</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #f8fafc;">${alert.response_time_ms} ms</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">HTTP Status</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: ${alert.status_code >= 400 ? '#f43f5e' : '#10b981'};">${alert.status_code}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Records Returned</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #f8fafc;">${alert.records_returned}</p>
            </div>
          </div>

          <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #818cf8; text-transform: uppercase;">✨ AI Root Cause Analysis (Gemini)</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #e2e8f0;">${alert.message}</p>
          </div>
        </div>

        <div style="padding: 16px 24px; background: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
          Intelligent API Monitor • Automated SRE Incident Notification
        </div>
      </div>
    `;
  }
}

module.exports = EmailService;
