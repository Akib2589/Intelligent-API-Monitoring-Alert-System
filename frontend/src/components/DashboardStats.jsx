import React from 'react';
import { AlertTriangle, ShieldAlert, Server, Activity } from 'lucide-react';

export default function DashboardStats({ stats, loading }) {
  const cards = [
    {
      title: 'Active Alerts',
      value: stats?.active_alerts ?? 0,
      description: 'Requiring immediate attention',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'High Severity Alerts',
      value: stats?.high_severity_alerts ?? 0,
      description: 'Critical service disruptions',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20'
    },
    {
      title: 'Monitored APIs',
      value: stats?.monitored_apis ?? 0,
      description: 'Endpoints with tracked metrics',
      icon: Server,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      title: 'Total Recorded',
      value: stats?.total_alerts ?? 0,
      description: 'Historical alerts in SQLite',
      icon: Activity,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-xl border bg-slate-800/80 backdrop-blur shadow-sm transition hover:border-slate-600 ${card.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {card.title}
                </p>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-700/60 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <span>{card.description}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
