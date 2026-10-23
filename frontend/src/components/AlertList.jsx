import React, { useState } from 'react';
import AlertCard from './AlertCard';
import { Search, Filter, CheckCircle, RefreshCw, AlertOctagon } from 'lucide-react';

export default function AlertList({
  alerts,
  loading,
  error,
  onRefresh,
  onResolveAlert
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter alerts by search query and severity
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.anomaly_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      filterSeverity === 'ALL' || alert.severity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Detected API Anomalies</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {filteredAlerts.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time health check anomalies with LLM root-cause summaries
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search API or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition w-44 sm:w-56"
            />
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-700 text-xs">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  filterSeverity === sev
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-md transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && alerts.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-xl border border-slate-800 bg-slate-800/40 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-slate-700/60 rounded" />
                <div className="h-5 w-20 bg-slate-700/60 rounded" />
              </div>
              <div className="h-10 bg-slate-900/40 rounded" />
              <div className="h-12 bg-slate-900/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">All Monitored APIs Are Healthy</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || filterSeverity !== 'ALL'
              ? 'No alerts match your current filter criteria.'
              : 'No active anomalies detected across your endpoints.'}
          </p>
        </div>
      )}

      {/* Alerts Grid / List */}
      {!loading && filteredAlerts.length > 0 && (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={onResolveAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}
