# Intelligent API Monitor 🛡️

A lightweight, robust API health monitoring and anomaly detection platform with automated AI-driven root cause explanations, SQLite persistence, and an interactive React dashboard.

---

## 1. Simplified Architecture

```
   [Static JSON / POST /monitor]
                 │
                 ▼
       Express.js Backend
   (Validate Input via Zod Schema)
                 │
                 ▼
   Health Checks & Anomaly Detection
   (Latency · HTTP Status · Record Count)
                 │
                 ▼
       AI Alert Generation
            (Gemini API )
                 │
                 ▼
        SQLite Database
     (alerts table via better-sqlite3)
                 │
                 ▼
         React Dashboard
    (Real-time Fetch via GET /alerts)
```

---

## 2. Technology Stack

| Component | Choice | Purpose |
|---|---|---|
| **Backend** | Node.js + Express | Fast, lightweight REST API server |
| **Language** | JavaScript (ESM / CommonJS) |
| **Database** | SQLite | Embedded zero-configuration ACID database |
| **SQLite Library** | `better-sqlite3` | Synchronous, fastest SQLite binding in Node |
| **AI Integration** | Gemini API | Generates concise, human-readable SRE incident explanations |
| **Frontend** | React 18 + Vite | Fast, responsive modern web dashboard |
| **Styling** | Tailwind CSS | Sleek dark-mode observability UI |
| **Input Validation** | Zod | Strict schema validation on incoming batches |
| **Logging** | Custom logger + Morgan | Structured operational logging |

---

## 3. Project Directory Structure

```
intelligent-api-monitor/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── monitor.controller.js
│   │   │   └── alerts.controller.js
│   │   ├── routes/
│   │   │   ├── monitor.routes.js
│   │   │   └── alerts.routes.js
│   │   ├── services/
│   │   │   ├── monitoring.service.js
│   │   │   ├── anomaly.service.js
│   │   │   └── ai.service.js
│   │   ├── models/
│   │   │   └── alert.model.js
│   │   ├── middleware/
│   │   │   └── error-handler.js
│   │   ├── utils/
│   │   │   └── logger.js
│   │   ├── app.js
│   │   └── server.js
│   ├── data/
│   │   └── monitoring.db
│   ├── tests/
│   │   ├── anomaly.test.js
│   │   └── api.test.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── AlertList.jsx
│   │   │   └── AlertCard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── fixtures/
│   └── api-responses.json
├── AI_Prompts.docx
├── AI_Prompts.md
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. SQLite Database Schema

The SQLite database file (`backend/data/monitoring.db`) is automatically initialized at startup:

```sql
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    records_returned INTEGER NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_api_name ON alerts(api_name);
```

### Field Definitions:
- `api_name`: Name of the affected service or API endpoint.
- `response_time_ms`: Round-trip latency in milliseconds.
- `status_code`: Returned HTTP status code (e.g., `500`, `200`, `404`).
- `records_returned`: Count of records returned in payload.
- `anomaly_type`: `HIGH_LATENCY`, `HTTP_ERROR`, or `ZERO_RECORDS`.
- `severity`: `LOW`, `MEDIUM`, or `HIGH`.
- `message`: AI-generated human-readable incident explanation.
- `status`: Lifecycle state (`ACTIVE` or `RESOLVED`).
- `created_at`: UTC timestamp of alert creation.

---

## 5. REST API Endpoints

### `POST /monitor`
Accepts one or more API observations, executes health checks & anomaly detection, requests AI explanations for detected anomalies, and persists alerts.

**Example Request:**
```http
POST /monitor HTTP/1.1
Content-Type: application/json

[
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  }
]
```

**Example Response:**
```json
{
  "success": true,
  "processed": 1,
  "anomalies_detected": 1,
  "message": "Monitoring completed"
}
```

---

### `GET /alerts`
Fetches alerts from the SQLite database. Supports optional `?status=ACTIVE` (default) or `?status=ALL`.

**Example Request:**
```http
GET /alerts HTTP/1.1
```

**Example Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "api_name": "AppointmentAPI",
      "response_time_ms": 5500,
      "status_code": 500,
      "records_returned": 0,
      "anomaly_type": "HTTP_ERROR",
      "severity": "HIGH",
      "message": "AppointmentAPI failed with HTTP 500 and critical latency of 5500ms, returning 0 records. A severe service crash or upstream timeout likely occurred.",
      "status": "ACTIVE",
      "created_at": "2026-10-23 00:00:00"
    }
  ]
}
```

---

### `GET /alerts/stats`
Fetches aggregated summary numbers for the dashboard cards.

**Example Response:**
```json
{
  "success": true,
  "stats": {
    "total_alerts": 4,
    "active_alerts": 3,
    "high_severity_alerts": 2,
    "monitored_apis": 5
  }
}
```

---

### `PATCH /alerts/:id/status`
Resolves an active alert.

**Example Request:**
```json
{
  "status": "RESOLVED"
}
```

---

## 6. Getting Started

### Prerequisites
- Node.js (v18+ recommended; tested on v24)
- npm

### 1. Installation

Install dependencies for both backend and frontend:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```
*(Add your `GEMINI_API_KEY` to `.env`. If omitted, the system seamlessly uses intelligent built-in heuristics with zero downtime or external dependencies).*

### 3. Run Backend

```bash
cd backend
npm start
```
The backend server runs on `http://localhost:3000`.

### 4. Run Frontend

```bash
cd frontend
npm run dev
```
The React dashboard runs on `http://localhost:5173`.

### 5. Run Automated Tests

```bash
cd backend
npm test
```

---

## 7. Testing with Fixtures

You can submit sample data from `fixtures/api-responses.json` directly using `curl`:

```bash
curl -X POST http://localhost:3000/monitor \
  -H "Content-Type: application/json" \
  -d @fixtures/api-responses.json
```

Or simply use the **"Input JSON"** or **"Sample Batch"** buttons in the top navigation bar of the React dashboard!

---

## 8. Optional Email Notification Feature

The email notification pipeline follows the architecture lifecycle:

```
Anomaly detected
      ↓
AI alert generated
      ↓
Alert saved to SQLite
      ↓
Email service sends notification
```

### Configuration:
In your `.env` file:
```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="API Monitor" <alerts@apimonitor.local>
ALERT_RECIPIENT_EMAIL=sre-team@example.com
```

- When SMTP credentials are provided, HTML incident reports are dispatched via `nodemailer`.
- When disabled or in development, email notifications are safely simulated in the application log without failing the transaction.
