const { getDatabase } = require('../config/database');

// Statement cache to prevent garbage collection issues during native async hooks in Node 24
const stmtCache = new Map();

function getCachedStatement(db, sql) {
  if (!stmtCache.has(sql)) {
    stmtCache.set(sql, db.prepare(sql));
  }
  return stmtCache.get(sql);
}

class AlertModel {
  static create({
    api_name,
    response_time_ms,
    status_code,
    records_returned,
    anomaly_type,
    severity,
    message,
    status = 'ACTIVE'
  }) {
    const db = getDatabase();
    const sql = `
      INSERT INTO alerts (
        api_name,
        response_time_ms,
        status_code,
        records_returned,
        anomaly_type,
        severity,
        message,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = getCachedStatement(db, sql);

    const result = stmt.run(
      api_name,
      response_time_ms,
      status_code,
      records_returned,
      anomaly_type,
      severity,
      message,
      status
    );

    return {
      id: Number(result.lastInsertRowid),
      api_name,
      response_time_ms,
      status_code,
      records_returned,
      anomaly_type,
      severity,
      message,
      status,
      created_at: new Date().toISOString()
    };
  }

  static findActive() {
    const db = getDatabase();
    const sql = `SELECT * FROM alerts WHERE status = 'ACTIVE' ORDER BY id DESC`;
    const stmt = getCachedStatement(db, sql);
    return stmt.all();
  }

  static findByStatus(status) {
    const db = getDatabase();
    const sql = `SELECT * FROM alerts WHERE status = ? ORDER BY id DESC`;
    const stmt = getCachedStatement(db, sql);
    return stmt.all(status);
  }

  static findAll() {
    const db = getDatabase();
    const sql = `SELECT * FROM alerts ORDER BY id DESC`;
    const stmt = getCachedStatement(db, sql);
    return stmt.all();
  }

  static findById(id) {
    const db = getDatabase();
    const sql = `SELECT * FROM alerts WHERE id = ?`;
    const stmt = getCachedStatement(db, sql);
    return stmt.get(id);
  }

  static updateStatus(id, status) {
    const db = getDatabase();
    const sql = `UPDATE alerts SET status = ? WHERE id = ?`;
    const stmt = getCachedStatement(db, sql);
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  static getStats() {
    const db = getDatabase();
    const sql = `
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_alerts,
        SUM(CASE WHEN severity = 'HIGH' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as high_severity_alerts,
        COUNT(DISTINCT api_name) as monitored_apis
      FROM alerts
    `;
    const stmt = getCachedStatement(db, sql);
    const row = stmt.get();
    return {
      total_alerts: row.total_alerts || 0,
      active_alerts: row.active_alerts || 0,
      high_severity_alerts: row.high_severity_alerts || 0,
      monitored_apis: row.monitored_apis || 0
    };
  }

  static clearAll() {
    const db = getDatabase();
    return db.exec('DELETE FROM alerts');
  }
}

module.exports = AlertModel;
