const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch alerts from backend
 * @param {string} [status='ACTIVE']
 * @returns {Promise<Array>}
 */
export async function getAlerts(status = 'ACTIVE') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE_URL}/alerts${query}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  }
  const data = await res.json();
  return data.alerts || [];
}

/**
 * Fetch dashboard statistics
 * @returns {Promise<Object>}
 */
export async function getStats() {
  const res = await fetch(`${API_BASE_URL}/alerts/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.statusText}`);
  }
  const data = await res.json();
  return data.stats || {
    total_alerts: 0,
    active_alerts: 0,
    high_severity_alerts: 0,
    monitored_apis: 0
  };
}

/**
 * Submit observations for monitoring
 * @param {Array<Object>} observations
 * @returns {Promise<Object>}
 */
export async function sendMonitorBatch(observations) {
  const res = await fetch(`${API_BASE_URL}/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(observations)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Monitor batch submission failed: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Update alert status (e.g. RESOLVE)
 * @param {number} id
 * @param {string} status
 * @returns {Promise<Object>}
 */
export async function updateAlertStatus(id, status = 'RESOLVED') {
  const res = await fetch(`${API_BASE_URL}/alerts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    throw new Error(`Failed to update alert: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Clear all alerts from the database
 * @returns {Promise<Object>}
 */
export async function clearAllAlerts() {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Failed to clear alerts: ${res.statusText}`);
  }
  return await res.json();
}
