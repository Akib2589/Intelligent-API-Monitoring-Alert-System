const env = require('../config/env');
const logger = require('../utils/logger');

class AIService {
  /**
   * Generates a concise, human-readable alert explanation for an anomaly using Gemini API.
   * @param {Object} anomalyData
   * @param {string} anomalyData.api_name
   * @param {number} anomalyData.response_time_ms
   * @param {number} anomalyData.status_code
   * @param {number} anomalyData.records_returned
   * @param {string} anomalyData.anomaly_type
   * @param {string} anomalyData.severity
   * @param {Array<string>} anomalyData.issues
   * @returns {Promise<string>}
   */
  static async generateAlertExplanation(anomalyData) {
    const {
      api_name,
      response_time_ms,
      status_code,
      records_returned,
      anomaly_type,
      severity,
      issues = []
    } = anomalyData;

    // Call Google Gemini API if key is configured
    if (env.GEMINI_API_KEY) {
      try {
        const explanation = await this._callGeminiAPI(anomalyData);
        if (explanation) return explanation;
      } catch (err) {
        logger.warn(`Gemini API call failed, falling back to smart heuristic: ${err.message}`);
      }
    }

    // Default intelligent contextual heuristic explanation
    return this._generateHeuristicExplanation(anomalyData);
  }

  /**
   * Calls Google Gemini API via native fetch
   */
  static async _callGeminiAPI(data) {
    const prompt = this._buildPrompt(data);
    const model = env.AI_MODEL || 'gemini-3.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
            thinkingConfig: {
              thinkingLevel: 'LOW'
            }
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let errDetails = '';
        try {
          const errJson = await response.json();
          errDetails = errJson?.error?.message || JSON.stringify(errJson);
        } catch (e) {
          errDetails = await response.text().catch(() => '');
        }
        throw new Error(`Gemini API returned status ${response.status}: ${errDetails}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Structured prompt template for Gemini LLM
   */
  static _buildPrompt({ api_name, response_time_ms, status_code, records_returned, anomaly_type, severity, issues }) {
    return `Generate a concise 1 to 2 sentence operational incident explanation for this detected API anomaly:
- API Name: ${api_name}
- Status Code: ${status_code}
- Response Time: ${response_time_ms}ms
- Records Returned: ${records_returned}
- Primary Anomaly Type: ${anomaly_type}
- Assessed Severity: ${severity}
- Detected Issues: ${issues.join(', ')}

Explain what failed, the likely operational cause, and the impact on end users. Avoid filler words.`;
  }

  /**
   * Intelligent heuristic generator when Gemini API key is absent or unreachable
   */
  static _generateHeuristicExplanation({ api_name, response_time_ms, status_code, records_returned, anomaly_type, severity, issues }) {
    if (status_code >= 500) {
      if (response_time_ms >= env.LATENCY_HIGH_THRESHOLD_MS) {
        return `${api_name} failed with HTTP ${status_code} and critical latency of ${response_time_ms}ms, returning 0 records. A severe service crash or upstream timeout likely occurred.`;
      }
      return `${api_name} failed with HTTP ${status_code} server error and returned 0 records. A service outage or unhandled exception may have occurred.`;
    }

    if (status_code === 404) {
      return `${api_name} returned HTTP 404 (Not Found). The target endpoint or requested resource was not located.`;
    }

    if (status_code === 429) {
      return `${api_name} was throttled with HTTP 429 (Too Many Requests). Rate limits have been exceeded.`;
    }

    if (status_code >= 400) {
      return `${api_name} encountered HTTP ${status_code} client error with ${records_returned} records returned. Verify request formatting and credentials.`;
    }

    if (response_time_ms >= env.LATENCY_HIGH_THRESHOLD_MS) {
      return `${api_name} took ${response_time_ms}ms to respond, exceeding the high latency threshold. High database load or network bottleneck suspected.`;
    }

    if (response_time_ms >= env.LATENCY_WARN_THRESHOLD_MS) {
      return `${api_name} exhibited elevated latency of ${response_time_ms}ms, which may degrade client application responsiveness.`;
    }

    if (records_returned === 0) {
      return `${api_name} returned a successful HTTP ${status_code} but delivered 0 records. Upstream data pipeline or empty query result may require inspection.`;
    }

    return `${api_name} triggered a ${anomaly_type} alert (${severity} severity) with latency ${response_time_ms}ms and status ${status_code}.`;
  }
}

module.exports = AIService;
