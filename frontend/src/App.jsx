import React, { useState, useEffect, useCallback } from 'react';
import DashboardStats from './components/DashboardStats';
import AlertList from './components/AlertList';
import JsonInputModal from './components/JsonInputModal';
import { 
  getAlerts, 
  getStats, 
  sendMonitorBatch, 
  updateAlertStatus, 
  clearAllAlerts 
} from './services/api';
import { 
  Activity, 
  Play, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Radio,
  FileJson
} from 'lucide-react';

// Sample batch based on fixtures/api-responses.json for interactive demo
const SAMPLE_FIXTURE_DATA = [
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  },
  {
    "api_name": "PatientRecordsAPI",
    "response_time_ms": 3400,
    "status_code": 200,
    "records_returned": 150
  },
  {
    "api_name": "InventorySearchAPI",
    "response_time_ms": 210,
    "status_code": 200,
    "records_returned": 0
  },
  {
    "api_name": "BillingServiceAPI",
    "response_time_ms": 4200,
    "status_code": 503,
    "records_returned": 0
  },
  {
    "api_name": "UserDirectoryAPI",
    "response_time_ms": 850,
    "status_code": 404,
    "records_returned": 0
  },
  {
    "api_name": "AuthService",
    "response_time_ms": 145,
    "status_code": 200,
    "records_returned": 1
  }
];

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('ACTIVE'); // 'ACTIVE' or 'ALL'
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsData, statsData] = await Promise.all([
        getAlerts(viewMode),
        getStats()
      ]);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler to ingest custom JSON from Modal
  const handleCustomJsonSubmit = async (jsonData) => {
    try {
      setIngesting(true);
      const result = await sendMonitorBatch(jsonData);
      setIsJsonModalOpen(false);
      showToast(
        `Analysis complete: ${result.processed} APIs evaluated, ${result.anomalies_detected} anomalies detected!`,
        result.anomalies_detected > 0 ? 'success' : 'info'
      );
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to analyze observation data', 'error');
    } finally {
      setIngesting(false);
    }
  };

  // Handler to ingest sample fixture batch
  const handleIngestFixture = async () => {
    try {
      setIngesting(true);
      const result = await sendMonitorBatch(SAMPLE_FIXTURE_DATA);
      showToast(
        `Sample batch processed: ${result.processed} evaluated, ${result.anomalies_detected} anomalies detected!`,
        'success'
      );
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to ingest batch', 'error');
    } finally {
      setIngesting(false);
    }
  };

  // Handler to resolve an alert
  const handleResolveAlert = async (id) => {
    try {
      await updateAlertStatus(id, 'RESOLVED');
      showToast(`Alert #${id} marked as RESOLVED`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  // Handler to clear alerts
  const handleClearAlerts = async () => {
    if (!window.confirm('Clear all alerts from SQLite database?')) return;
    try {
      await clearAllAlerts();
      showToast('All alerts cleared', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to clear alerts', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Intelligent API Monitor
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" /> Live
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Automated Health Checks • Anomaly Detection • AI Root Cause
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Custom JSON Input Button */}
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              title="Input or upload custom JSON observations to analyze"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Input JSON</span>
            </button>

            {/* Quick Sample Batch Ingestion */}
            <button
              onClick={handleIngestFixture}
              disabled={ingesting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              title="Run anomaly detection on the 6 sample APIs from the test fixture"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${ingesting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{ingesting ? 'Analyzing...' : 'Sample Batch'}</span>
            </button>

            {/* Clear Database */}
            <button
              onClick={handleClearAlerts}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Reset alerts database"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-medium transition ${
              toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : 'bg-emerald-950 text-emerald-200 border-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'ACTIVE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Alerts
            </button>
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts (History)
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Engine: Express + SQLite (<span className="text-slate-300 font-mono">better-sqlite3</span>)
          </div>
        </div>

        {/* Top Summary Cards */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Alerts List */}
        <AlertList
          alerts={alerts}
          loading={loading}
          error={error}
          onRefresh={loadData}
          onResolveAlert={handleResolveAlert}
        />
      </main>

      {/* Custom JSON Input Modal */}
      <JsonInputModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSubmit={handleCustomJsonSubmit}
        isSubmitting={ingesting}
      />
    </div>
  );
}
