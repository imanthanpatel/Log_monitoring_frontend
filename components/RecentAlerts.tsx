"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "../lib/api";

interface MitreTechnique {
  id: number;
  technique_id: string;
  name: string;
  tactic: string;
  description: string | null;
}

interface Alert {
  id: number;
  rule_name: string;
  severity: string;
  description: string;
  status: string;
  assigned: boolean;
  timestamp: string;
  mitre_technique: MitreTechnique | null;
}

interface AlertsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Alert[];
}

export default function RecentAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data: AlertsResponse = await getAlerts();

        // Show only the latest 8 alerts on the dashboard
        setAlerts(data.results.slice(0, 8));
      } catch (error) {
        console.error("Failed to load recent alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const severityClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/15 text-red-400 border border-red-500/30";

      case "High":
        return "bg-orange-500/15 text-orange-400 border border-orange-500/30";

      case "Medium":
        return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";

      case "Low":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";

      default:
        return "bg-gray-500/15 text-gray-400 border border-gray-500/30";
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "text-red-400";

      case "ASSIGNED":
        return "text-blue-400";

      case "CLOSED":
        return "text-green-400";

      case "RESOLVED":
        return "text-green-400";

      case "FALSE_POSITIVE":
        return "text-gray-400";

      default:
        return "text-gray-400";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <section className="bg-[#0d1424] border border-gray-800 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-white">
            Recent Security Alerts
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Latest alerts detected by SentinelSIEM
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = "/alerts";
          }}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition"
        >
          View All →
        </button>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500">
            Loading recent alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            No security alerts found.
          </div>
        ) : (

          <table className="w-full">

            <thead>
              <tr className="border-b border-gray-800 text-left">

                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert
                </th>

                <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>

                <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MITRE
                </th>

                <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detected
                </th>

              </tr>
            </thead>

            <tbody>

              {alerts.map((alert) => (

                <tr
                  key={alert.id}
                  onClick={() => {
                    window.location.href = `/alerts/${alert.id}`;
                  }}
                  className="border-b border-gray-800/70 hover:bg-white/[0.02] cursor-pointer transition"
                >

                  {/* Alert */}
                  <td className="px-6 py-4 max-w-[420px]">

                    <div className="flex items-start gap-3">

                      <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />

                      <div className="min-w-0">

                        <p className="text-sm font-medium text-gray-200 truncate">
                          {alert.rule_name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 truncate">
                          #{alert.id} · {alert.description}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* Severity */}
                  <td className="px-4 py-4">

                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${severityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>

                  </td>

                  {/* MITRE */}
                  <td className="px-4 py-4">

                    {alert.mitre_technique ? (
                      <div>

                        <p className="text-sm text-cyan-400 font-medium">
                          {alert.mitre_technique.technique_id}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 max-w-[180px] truncate">
                          {alert.mitre_technique.name}
                        </p>

                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">
                        Not mapped
                      </span>
                    )}

                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">

                    <span
                      className={`text-xs font-medium ${statusClass(
                        alert.status
                      )}`}
                    >
                      ● {formatStatus(alert.status)}
                    </span>

                  </td>

                  {/* Timestamp */}
                  <td className="px-6 py-4 whitespace-nowrap">

                    <p className="text-xs text-gray-400">
                      {formatTime(alert.timestamp)}
                    </p>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* Footer */}
      {!loading && alerts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">

          <p className="text-xs text-gray-500">
            Showing {alerts.length} of the latest security alerts
          </p>

          <button
            onClick={() => {
              window.location.href = "/alerts";
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Open Alert Management →
          </button>

        </div>
      )}

    </section>
  );
}