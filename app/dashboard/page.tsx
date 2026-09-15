"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAlerts, getDashboard } from "../../lib/api";
import RecentAlerts from "../../components/RecentAlerts";

interface DashboardData {
  total_logs: number;
  total_alerts: number;
  active_rules: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  total_users: number;
  failed_logins: number;
}

interface MitreTechnique {
  id: number;
  technique_id: string;
  name: string;
  tactic: string;
  description: string | null;
}

interface Alert {
  id: number;
  mitre_technique: MitreTechnique | null;
  rule_name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  status: string;
  assigned: boolean;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, alertsData] = await Promise.all([
        getDashboard(),
        getAlerts(),
      ]);

      setDashboard(dashboardData);
      setAlerts(alertsData.results || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      if (
        message === "Authentication required" ||
        message === "Session expired"
      ) {
        router.push("/login");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    router.push("/login");
  }

  function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }

  function getSeverityClass(severity: string) {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 text-red-400 border-red-500/30";

      case "High":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";

      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";

      case "Low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";

      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "OPEN":
        return "bg-red-500/10 text-red-400";

      case "ASSIGNED":
        return "bg-blue-500/10 text-blue-400";

      case "CLOSED":
        return "bg-green-500/10 text-green-400";

      case "RESOLVED":
        return "bg-purple-500/10 text-purple-400";

      default:
        return "bg-gray-500/10 text-gray-400";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-400">
            Loading SentinelSIEM dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <div className="bg-[#0d1422] border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="text-red-400 text-4xl mb-4">⚠</div>

          <h2 className="text-xl font-semibold mb-2">
            Dashboard Error
          </h2>

          <p className="text-gray-400 mb-6">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a101c] border-r border-gray-800 hidden lg:flex flex-col">

        {/* Logo */}

        <div className="h-20 flex items-center px-6 border-b border-gray-800">

          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mr-3">
            <span className="text-cyan-400 text-xl">
              🛡
            </span>
          </div>

          <div>
            <h1 className="font-bold text-lg">
              SentinelSIEM
            </h1>

            <p className="text-xs text-gray-500">
              Security Operations
            </p>
          </div>

        </div>

        {/* Navigation */}

        <nav className="flex-1 p-4">

          <p className="text-xs uppercase tracking-wider text-gray-600 px-3 mb-3">
            Monitoring
          </p>

          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2"
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            onClick={() => router.push("/alerts")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>⚠</span>
            Alerts
          </button>

          <button
            onClick={() => router.push("/logs")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>≡</span>
            Logs
          </button>

          <p className="text-xs uppercase tracking-wider text-gray-600 px-3 mb-3 mt-8">
            Investigation
          </p>

          <button
            onClick={() => router.push("/investigations")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>⌕</span>
            Investigations
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>🔔</span>
            Notifications
          </button>

          <p className="text-xs uppercase tracking-wider text-gray-600 px-3 mb-3 mt-8">
            Management
          </p>

          <button
            onClick={() => router.push("/rules")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>⚙</span>
            Detection Rules
          </button>

          <button
            onClick={() => router.push("/mitre")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>◈</span>
            MITRE ATT&CK
          </button>

          <button
            onClick={() => router.push("/audit-logs")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition mb-2"
          >
            <span>▤</span>
            Audit Logs
          </button>

        </nav>

        {/* User */}

        <div className="p-4 border-t border-gray-800">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold">
              {(localStorage.getItem("username") || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="overflow-hidden">

              <p className="text-sm font-medium truncate">
                {localStorage.getItem("username") || "User"}
              </p>

              <p className="text-xs text-gray-500">
                {localStorage.getItem("role") || "USER"}
              </p>

            </div>

          </div>

          <button
            onClick={logout}
            className="w-full py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition"
          >
            Logout
          </button>

        <div className="mt-6">
            <RecentAlerts />
        </div>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="lg:ml-64">

        {/* TOPBAR */}

        <header className="h-20 border-b border-gray-800 bg-[#080e19]/90 backdrop-blur flex items-center justify-between px-6 lg:px-8">

          <div>

            <h2 className="text-xl font-semibold">
              Security Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Real-time security monitoring overview
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">

              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <span className="text-sm text-green-400">
                System Online
              </span>

            </div>

            <button
              onClick={loadDashboard}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 transition text-sm"
            >
              ↻ Refresh
            </button>

          </div>

        </header>


        {/* DASHBOARD BODY */}

        <div className="p-6 lg:p-8">

          {/* STAT CARDS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

            <StatCard
              title="Total Logs"
              value={dashboard.total_logs}
              icon="≡"
              subtitle="Events ingested"
            />

            <StatCard
              title="Total Alerts"
              value={dashboard.total_alerts}
              icon="⚠"
              subtitle="Security alerts"
            />

            <StatCard
              title="Active Rules"
              value={dashboard.active_rules}
              icon="⚙"
              subtitle="Detection rules"
            />

            <StatCard
              title="Failed Logins"
              value={dashboard.failed_logins}
              icon="✕"
              subtitle="Authentication failures"
            />

          </div>


          {/* SECOND ROW */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

            <SeverityCard
              title="Critical"
              value={dashboard.critical_alerts}
              description="Immediate attention"
              className="text-red-400"
            />

            <SeverityCard
              title="High"
              value={dashboard.high_alerts}
              description="High priority"
              className="text-orange-400"
            />

            <SeverityCard
              title="Medium"
              value={dashboard.medium_alerts}
              description="Requires investigation"
              className="text-yellow-400"
            />

            <SeverityCard
              title="Low"
              value={dashboard.low_alerts}
              description="Low priority"
              className="text-blue-400"
            />

          </div>


          {/* ALERT OVERVIEW + USERS */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

            {/* Severity Distribution */}

            <div className="xl:col-span-2 bg-[#0d1422] border border-gray-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h3 className="font-semibold text-lg">
                    Alert Severity Distribution
                  </h3>

                  <p className="text-sm text-gray-500">
                    Current security alert breakdown
                  </p>

                </div>

                <span className="text-xs text-gray-500">
                  {dashboard.total_alerts} total
                </span>

              </div>

              <SeverityBar
                label="Critical"
                value={dashboard.critical_alerts}
                total={dashboard.total_alerts}
                className="bg-red-500"
                textClass="text-red-400"
              />

              <SeverityBar
                label="High"
                value={dashboard.high_alerts}
                total={dashboard.total_alerts}
                className="bg-orange-500"
                textClass="text-orange-400"
              />

              <SeverityBar
                label="Medium"
                value={dashboard.medium_alerts}
                total={dashboard.total_alerts}
                className="bg-yellow-500"
                textClass="text-yellow-400"
              />

              <SeverityBar
                label="Low"
                value={dashboard.low_alerts}
                total={dashboard.total_alerts}
                className="bg-blue-500"
                textClass="text-blue-400"
              />

            </div>


            {/* Users */}

            <div className="bg-[#0d1422] border border-gray-800 rounded-xl p-6">

              <h3 className="font-semibold text-lg mb-1">
                Users
              </h3>

              <p className="text-sm text-gray-500 mb-8">
                Registered system users
              </p>

              <div className="flex items-center justify-center py-4">

                <div className="w-36 h-36 rounded-full border-8 border-cyan-500/20 flex items-center justify-center">

                  <div className="text-center">

                    <p className="text-4xl font-bold">
                      {dashboard.total_users}
                    </p>

                    <p className="text-xs text-gray-500">
                      Users
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={() => router.push("/users")}
                className="w-full mt-4 py-2 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 transition text-sm"
              >
                Manage Users →
              </button>

            </div>

          </div>


          {/* RECENT ALERTS */}

          <div className="bg-[#0d1422] border border-gray-800 rounded-xl overflow-hidden">

            <div className="p-6 border-b border-gray-800 flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-lg">
                  Recent Alerts
                </h3>

                <p className="text-sm text-gray-500">
                  Latest security events detected by SentinelSIEM
                </p>

              </div>

              <button
                onClick={() => router.push("/alerts")}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View All →
              </button>

            </div>


            {/* Desktop table */}

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-gray-800 text-gray-500">

                    <th className="text-left px-6 py-4 font-medium">
                      ID
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      Rule
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      Severity
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      MITRE
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      Assigned
                    </th>

                    <th className="text-left px-6 py-4 font-medium">
                      Time
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {alerts.slice(0, 8).map((alert) => (

                    <tr
                      key={alert.id}
                      onClick={() =>
                        router.push(`/alerts/${alert.id}`)
                      }
                      className="border-b border-gray-800/70 hover:bg-gray-800/30 cursor-pointer transition"
                    >

                      <td className="px-6 py-4 text-gray-400">
                        #{alert.id}
                      </td>

                      <td className="px-6 py-4">

                        <div>

                          <p className="font-medium">
                            {alert.rule_name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {alert.description}
                          </p>

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getSeverityClass(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        {alert.mitre_technique ? (

                          <div>

                            <p className="text-cyan-400 font-medium">
                              {alert.mitre_technique.technique_id}
                            </p>

                            <p className="text-xs text-gray-500">
                              {alert.mitre_technique.name}
                            </p>

                          </div>

                        ) : (

                          <span className="text-gray-600">
                            —
                          </span>

                        )}

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusClass(
                            alert.status
                          )}`}
                        >
                          {alert.status}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        {alert.assigned ? (

                          <span className="text-green-400 text-xs">
                            ✓ Assigned
                          </span>

                        ) : (

                          <span className="text-gray-500 text-xs">
                            Unassigned
                          </span>

                        )}

                      </td>

                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(alert.timestamp)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {alerts.length === 0 && (

              <div className="p-10 text-center text-gray-500">
                No alerts found.
              </div>

            )}

          </div>


          {/* FOOTER */}

          <div className="mt-8 flex flex-col md:flex-row justify-between gap-2 text-xs text-gray-600">

            <p>
              SentinelSIEM Security Monitoring Platform
            </p>

            <p>
              Django REST API • JWT Authentication • MITRE ATT&CK
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================
   COMPONENTS
========================= */

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  subtitle: string;
}) {
  return (
    <div className="bg-[#0d1422] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="text-3xl font-bold mt-2">
            {value.toLocaleString()}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            {subtitle}
          </p>

        </div>

        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          {icon}
        </div>

      </div>

    </div>
  );
}


function SeverityCard({
  title,
  value,
  description,
  className,
}: {
  title: string;
  value: number;
  description: string;
  className: string;
}) {
  return (
    <div className="bg-[#0d1422] border border-gray-800 rounded-xl p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className={`text-sm font-medium ${className}`}>
            {title}
          </p>

          <p className="text-3xl font-bold mt-2">
            {value}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            {description}
          </p>

        </div>

        <div
          className={`w-3 h-12 rounded-full opacity-70 ${className.replace(
            "text-",
            "bg-"
          )}`}
        />

      </div>

    </div>
  );
}


function SeverityBar({
  label,
  value,
  total,
  className,
  textClass,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
  textClass: string;
}) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="mb-5">

      <div className="flex justify-between mb-2">

        <span className="text-sm text-gray-400">
          {label}
        </span>

        <span className={`text-sm font-medium ${textClass}`}>
          {value} ({percentage}%)
        </span>

      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${percentage}%` }}
        />

      </div>

    </div>
  );
}