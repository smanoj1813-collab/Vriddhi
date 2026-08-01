import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSystemHealth,
  useHealthHistory,
  useSlowQueries,
  useErrorLogs,
  usePerformanceMetrics,
  useResolveError,
  useAcknowledgeAlert,
} from '../hooks/useSuperAdmin';
import { useNotification } from '../../../shared/providers/NotificationProvider';
import {
  Activity, ArrowLeft, Server, Database, Cloud, Zap,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  Minus, RefreshCw, ChevronDown, ChevronUp, XCircle, Bell,
  type LucideIcon
} from "lucide-react";
import type { ServiceHealth, HealthStatus, SlowQuery, ErrorLog, HealthAlert, PerformanceMetric } from '../types/superAdmin';

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  operational: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", label: "Operational" },
  degraded: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Degraded" },
  down: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Down" },
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10" },
};

const ServiceCard: React.FC<{ service: ServiceHealth }> = ({ service }) => {
  const config = STATUS_CONFIG[service.status] || STATUS_CONFIG.operational;
  const Icon = config.icon;

  return (
    <div className={`bg-slate-800/50 border rounded-xl p-4 transition-colors ${
      service.status === "down" ? "border-red-500/50 animate-pulse" :
      service.status === "degraded" ? "border-yellow-500/50" :
      "border-slate-700"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          <span className="text-white font-medium text-sm">{service.name}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-500">Uptime</p>
          <p className="text-white font-medium">{service.uptime.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-500">Response</p>
          <p className="text-white font-medium">{service.responseTime}ms</p>
        </div>
        <div>
          <p className="text-slate-500">Error Rate</p>
          <p className="text-white font-medium">{service.errorRate.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-500">Req/min</p>
          <p className="text-white font-medium">{service.requestsPerMinute}</p>
        </div>
      </div>
    </div>
  );
};

const SystemHealthMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<"overview" | "queries" | "errors" | "performance">("overview");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: history } = useHealthHistory(24);
  const { data: slowQueries } = useSlowQueries(20);
  const { data: errorLogs } = useErrorLogs();
  const { data: performance } = usePerformanceMetrics(24);
  const resolveError = useResolveError();
  const acknowledgeAlert = useAcknowledgeAlert();

  const handleResolveError = async (errorId: string) => {
    try {
      await resolveError.mutateAsync(errorId);
      showSuccess("Error marked as resolved");
    } catch {
      showError("Failed to resolve error");
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId);
      showSuccess("Alert acknowledged");
    } catch {
      showError("Failed to acknowledge alert");
    }
  };

  if (healthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    );
  }

  const overallStatus = health?.overallStatus || "healthy";
  const statusColor = overallStatus === "healthy" ? "text-green-400" : overallStatus === "degraded" ? "text-yellow-400" : "text-red-400";
  const statusBg = overallStatus === "healthy" ? "bg-green-500/10" : overallStatus === "degraded" ? "bg-yellow-500/10" : "bg-red-500/10";

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-white">System Health Monitor</h1>
            </div>
            <p className="text-slate-400 text-sm">Monitor system performance and health metrics</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusBg}`}>
          <div className={`w-2 h-2 rounded-full ${overallStatus === "healthy" ? "bg-green-400 animate-pulse" : overallStatus === "degraded" ? "bg-yellow-400" : "bg-red-400 animate-pulse"}`} />
          <span className={`text-sm font-medium ${statusColor} capitalize`}>{overallStatus}</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Uptime (24h)</p>
          <p className="text-2xl font-bold text-white">{health?.uptime24h?.toFixed(2) || "99.99"}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Error Rate (24h)</p>
          <p className="text-2xl font-bold text-white">{health?.errorRate24h?.toFixed(2) || "0.02"}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-white">{health?.avgResponseTime || "85"}ms</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-white">{(health?.totalRequests24h || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: "overview", label: "Overview", icon: Activity },
          { key: "queries", label: "Slow Queries", icon: Database },
          { key: "errors", label: "Error Logs", icon: AlertTriangle },
          { key: "performance", label: "Performance", icon: TrendingUp },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Services Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {health?.services?.map((service: ServiceHealth) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>

          {/* Alerts */}
          {health?.alerts && health.alerts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Active Alerts</h2>
              <div className="space-y-2">
                {health.alerts.map((alert: HealthAlert) => {
                  const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
                  return (
                    <div key={alert.id} className={`flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 ${
                      alert.severity === "critical" ? "border-red-500/30" : alert.severity === "warning" ? "border-yellow-500/30" : ""
                    }`}>
                      <div className="flex items-center gap-3">
                        <Bell className={`w-5 h-5 ${severityConfig.color}`} />
                        <div>
                          <p className="text-sm text-white font-medium">{alert.message}</p>
                          <p className="text-xs text-slate-500">{alert.service} • {new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slow Queries Tab */}
      {activeTab === "queries" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left px-4 py-3 font-medium">Query</th>
                <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                <th className="text-right px-4 py-3 font-medium">Duration</th>
                <th className="text-center px-4 py-3 font-medium">Severity</th>
                <th className="text-center px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {slowQueries?.map((query: SlowQuery) => {
                const severityConfig = SEVERITY_CONFIG[query.severity] || SEVERITY_CONFIG.medium;
                return (
                  <tr key={query.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs max-w-md truncate">{query.query}</td>
                    <td className="px-4 py-3 text-slate-400">{query.endpoint}</td>
                    <td className="px-4 py-3 text-right text-white font-medium">{query.duration}ms</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig.bg} ${severityConfig.color}`}>
                        {query.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 text-xs">{new Date(query.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!slowQueries || slowQueries.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No slow queries found</p>
            </div>
          )}
        </div>
      )}

      {/* Error Logs Tab */}
      {activeTab === "errors" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left px-4 py-3 font-medium">Message</th>
                <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Count</th>
                <th className="text-center px-4 py-3 font-medium">Last Seen</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs?.items?.map((error: ErrorLog) => (
                <tr key={error.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{error.message}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{error.endpoint}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      error.statusCode >= 500 ? "bg-red-500/10 text-red-400" :
                      error.statusCode >= 400 ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-green-500/10 text-green-400"
                    }`}>
                      {error.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-medium">{error.count}</td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{new Date(error.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {!error.resolved && (
                      <button
                        onClick={() => handleResolveError(error.id)}
                        className="px-2 py-1 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!errorLogs?.items || errorLogs.items.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No errors found</p>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3">Response Time Trend</h3>
              <div className="h-48 flex items-end gap-1">
                {performance?.map((metric: PerformanceMetric, i: number) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-t transition-colors"
                    style={{ height: `${Math.min((metric.responseTime / 150) * 100, 100)}%` }}
                    title={`${metric.responseTime.toFixed(0)}ms`}
                  />
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3">Error Rate Trend</h3>
              <div className="h-48 flex items-end gap-1">
                {performance?.map((metric: PerformanceMetric, i: number) => (
                  <div
                    key={i}
                    className="flex-1 bg-red-500/30 hover:bg-red-500/50 rounded-t transition-colors"
                    style={{ height: `${Math.min((metric.errorRate / 0.1) * 100, 100)}%` }}
                    title={`${(metric.errorRate * 100).toFixed(2)}%`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-right px-4 py-3 font-medium">Response Time</th>
                  <th className="text-right px-4 py-3 font-medium">Req/min</th>
                  <th className="text-right px-4 py-3 font-medium">Error Rate</th>
                  <th className="text-right px-4 py-3 font-medium">CPU</th>
                  <th className="text-right px-4 py-3 font-medium">Memory</th>
                </tr>
              </thead>
              <tbody>
                {performance?.map((metric: PerformanceMetric, i: number) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(metric.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white">{metric.responseTime.toFixed(0)}ms</td>
                    <td className="px-4 py-3 text-right text-white">{metric.requestsPerMinute.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right text-white">{(metric.errorRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-white">{metric.cpuUsage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-white">{metric.memoryUsage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
