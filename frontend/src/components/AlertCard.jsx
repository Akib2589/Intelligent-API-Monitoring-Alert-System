import React from 'react';
import { 
  Clock, 
  Database, 
  Server, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from 'lucide-react';

export default function AlertCard({ alert, onResolve }) {
  const isHigh = alert.severity === 'HIGH';
  const isMedium = alert.severity === 'MEDIUM';

  const severityBadgeClass = isHigh
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : isMedium
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-blue-500/15 text-blue-300 border-blue-500/30';

  const typeBadgeClass = alert.anomaly_type === 'HTTP_ERROR'
    ? 'bg-red-950/60 text-red-200 border-red-800/40'
    : alert.anomaly_type === 'HIGH_LATENCY'
    ? 'bg-orange-950/60 text-orange-200 border-orange-800/40'
    : 'bg-indigo-950/60 text-indigo-200 border-indigo-800/40';

  const isResolved = alert.status === 'RESOLVED';

  // Format date cleanly
  const formattedDate = alert.created_at
    ? new Date(alert.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : 'Just now';

  return (
    <div
      className={`rounded-xl border transition duration-150 ${
        isResolved
          ? 'bg-slate-800/40 border-slate-700/60 opacity-75'
          : isHigh
          ? 'bg-slate-800/90 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/20'
          : 'bg-slate-800/90 border-slate-700 hover:border-slate-600 shadow-sm'
      } p-5`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/60 border border-slate-600/40 text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                {alert.api_name}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${severityBadgeClass}`}>
                {alert.severity}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${typeBadgeClass}`}>
                {alert.anomaly_type}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detected at: {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
              isResolved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
            }`}
          >
            {alert.status}
          </span>
          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md transition flex items-center gap-1.5"
              title="Mark alert as resolved"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* Observation Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 bg-slate-900/70 p-3 rounded-lg border border-slate-700/60 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-slate-400">Response Time</p>
            <p className={`font-mono font-semibold ${alert.response_time_ms >= 3000 ? 'text-rose-400' : alert.response_time_ms >= 1500 ? 'text-amber-400' : 'text-slate-200'}`}>
              {alert.response_time_ms} ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-slate-400">HTTP Status</p>
            <p className={`font-mono font-semibold ${alert.status_code >= 500 ? 'text-rose-400' : alert.status_code >= 400 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {alert.status_code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-slate-400">Records</p>
            <p className={`font-mono font-semibold ${alert.records_returned === 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {alert.records_returned} records
            </p>
          </div>
        </div>
      </div>

      {/* AI Explanation Box */}
      <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-slate-200 text-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Alert Explanation</span>
        </div>
        <p className="leading-relaxed text-slate-200">
          {alert.message}
        </p>
      </div>
    </div>
  );
}
