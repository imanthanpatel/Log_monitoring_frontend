"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAlerts } from "../../lib/api";

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

type SeverityFilter =
  | "ALL"
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

type StatusFilter =
  | "ALL"
  | "OPEN"
  | "ASSIGNED"
  | "CLOSED"
  | "FALSE_POSITIVE"
  | "RESOLVED";

export default function AlertsPage() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [search, setSearch] = useState("");

  const loadAlerts = async (
    selectedPage: number = page,
    isRefresh: boolean = false
  ) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data: AlertsResponse =
        await getAlerts(selectedPage);

      setAlerts(data.results);
      setTotalCount(data.count);

      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));

      setPage(selectedPage);
    } catch (err: any) {
      if (err.message === "Session expired") {
        router.push("/login");
        return;
      }

      setError(
        err.message || "Failed to load alerts"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    loadAlerts(1);
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "ALL" ||
        alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        alert.status === statusFilter;

      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        alert.rule_name
          .toLowerCase()
          .includes(searchText) ||
        alert.description
          .toLowerCase()
          .includes(searchText) ||
        String(alert.id).includes(searchText) ||
        alert.mitre_technique?.technique_id
          .toLowerCase()
          .includes(searchText) ||
        alert.mitre_technique?.name
          .toLowerCase()
          .includes(searchText);

      return (
        matchesSeverity &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    alerts,
    severityFilter,
    statusFilter,
    search,
  ]);

  const severityClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/15 text-red-400 border-red-500/30";

      case "High":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";

      case "Medium":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

      case "Low":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";

      default:
        return "bg-gray-500/15 text-gray-400 border-gray-500/30";
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-500/10 text-red-400";

      case "ASSIGNED":
        return "bg-blue-500/10 text-blue-400";

      case "CLOSED":
        return "bg-green-500/10 text-green-400";

      case "RESOLVED":
        return "bg-green-500/10 text-green-400";

      case "FALSE_POSITIVE":
        return "bg-gray-500/10 text-gray-400";

      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const formatStatus = (status: string) => {
    return status.replaceAll("_", " ");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handlePrevious = () => {
    if (hasPrevious && page > 1) {
      loadAlerts(page - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      loadAlerts(page + 1);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-[#080d18] text-white">

      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1424]">

        <div className="max-w-[1600px] mx-auto px-6 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-500 hover:text-cyan-400 transition mb-2"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold">
                Security Alerts
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Monitor and manage security alerts detected by
                SentinelSIEM
              </p>

            </div>

            <button
              onClick={() => loadAlerts(page, true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-lg border border-gray-700 bg-[#111827] hover:bg-gray-800 text-sm transition disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

        </div>

      </header>


      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-6 py-7">

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-[#0d1424] border border-gray-800 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Total Alerts
            </p>

            <p className="text-2xl font-bold mt-2">
              {totalCount}
            </p>
          </div>

          <div className="bg-[#0d1424] border border-red-500/20 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Critical
            </p>

            <p className="text-2xl font-bold text-red-400 mt-2">
              {alerts.filter(
                (a) => a.severity === "Critical"
              ).length}
            </p>
          </div>

          <div className="bg-[#0d1424] border border-orange-500/20 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              High
            </p>

            <p className="text-2xl font-bold text-orange-400 mt-2">
              {alerts.filter(
                (a) => a.severity === "High"
              ).length}
            </p>
          </div>

          <div className="bg-[#0d1424] border border-yellow-500/20 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Open on Page
            </p>

            <p className="text-2xl font-bold text-yellow-400 mt-2">
              {alerts.filter(
                (a) => a.status === "OPEN"
              ).length}
            </p>
          </div>

        </div>


        {/* Filters */}
        <div className="bg-[#0d1424] border border-gray-800 rounded-xl p-5 mb-6">

          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="flex-1">

              <label className="block text-xs text-gray-500 mb-2">
                Search Alerts
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by ID, rule, description, MITRE..."
                className="w-full bg-[#080d18] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500 transition"
              />

            </div>


            {/* Severity */}
            <div className="w-full lg:w-52">

              <label className="block text-xs text-gray-500 mb-2">
                Severity
              </label>

              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(
                    e.target.value as SeverityFilter
                  )
                }
                className="w-full bg-[#080d18] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-cyan-500"
              >
                <option value="ALL">
                  All Severities
                </option>

                <option value="Critical">
                  Critical
                </option>

                <option value="High">
                  High
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Low">
                  Low
                </option>

              </select>

            </div>


            {/* Status */}
            <div className="w-full lg:w-52">

              <label className="block text-xs text-gray-500 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as StatusFilter
                  )
                }
                className="w-full bg-[#080d18] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-cyan-500"
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="OPEN">
                  Open
                </option>

                <option value="ASSIGNED">
                  Assigned
                </option>

                <option value="CLOSED">
                  Closed
                </option>

                <option value="RESOLVED">
                  Resolved
                </option>

                <option value="FALSE_POSITIVE">
                  False Positive
                </option>

              </select>

            </div>


            {/* Clear */}
            <div className="flex items-end">

              <button
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                Clear
              </button>

            </div>

          </div>


          {/* Quick severity buttons */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-800">

            <span className="text-xs text-gray-600 mr-2 self-center">
              Quick filter:
            </span>

            {[
              "ALL",
              "Critical",
              "High",
              "Medium",
              "Low",
            ].map((severity) => (

              <button
                key={severity}
                onClick={() =>
                  setSeverityFilter(
                    severity as SeverityFilter
                  )
                }
                className={`px-3 py-1.5 rounded-md text-xs transition ${
                  severityFilter === severity
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "bg-gray-800/60 text-gray-500 border border-gray-800 hover:text-gray-300"
                }`}
              >
                {severity === "ALL"
                  ? "All"
                  : severity}

              </button>

            ))}

          </div>

        </div>


        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">

            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              onClick={() => loadAlerts(page)}
              className="text-xs text-red-300 hover:text-red-200 mt-3 underline"
            >
              Try again
            </button>

          </div>
        )}


        {/* Alert Table */}
        <div className="bg-[#0d1424] border border-gray-800 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold">
                Alert Management
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {filteredAlerts.length} alerts shown on
                this page
              </p>

            </div>

            <div className="text-xs text-gray-600">
              Page {page}
            </div>

          </div>


          {loading ? (

            <div className="py-20 text-center">

              <div className="text-gray-500 text-sm">
                Loading security alerts...
              </div>

            </div>

          ) : filteredAlerts.length === 0 ? (

            <div className="py-20 text-center">

              <div className="text-gray-500 text-sm">
                No alerts match your filters.
              </div>

              <button
                onClick={clearFilters}
                className="text-cyan-400 text-sm mt-3 hover:text-cyan-300"
              >
                Clear filters
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-gray-800 bg-[#0a101d]">

                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detection Rule
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MITRE ATT&CK
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detected
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredAlerts.map((alert) => (

                    <tr
                      key={alert.id}
                      onClick={() =>
                        router.push(
                          `/alerts/${alert.id}`
                        )
                      }
                      className="border-b border-gray-800/70 hover:bg-white/[0.025] cursor-pointer transition"
                    >

                      {/* ID */}
                      <td className="px-6 py-4">

                        <span className="text-sm font-mono text-cyan-400">
                          #{alert.id}
                        </span>

                      </td>


                      {/* Rule */}
                      <td className="px-4 py-4 min-w-[260px]">

                        <p className="text-sm font-medium text-gray-200">
                          {alert.rule_name}
                        </p>

                        <p className="text-xs text-gray-600 mt-1 max-w-[350px] truncate">
                          {alert.description}
                        </p>

                      </td>


                      {/* Severity */}
                      <td className="px-4 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${severityClass(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>

                      </td>


                      {/* MITRE */}
                      <td className="px-4 py-4 min-w-[170px]">

                        {alert.mitre_technique ? (

                          <div>

                            <p className="text-sm font-medium text-cyan-400">
                              {
                                alert
                                  .mitre_technique
                                  .technique_id
                              }
                            </p>

                            <p className="text-xs text-gray-500 mt-1 max-w-[180px] truncate">
                              {
                                alert
                                  .mitre_technique
                                  .name
                              }
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
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusClass(
                            alert.status
                          )}`}
                        >
                          {formatStatus(
                            alert.status
                          )}
                        </span>

                      </td>


                      {/* Assignment */}
                      <td className="px-4 py-4">

                        {alert.assigned ? (

                          <span className="text-xs text-green-400">
                            ● Assigned
                          </span>

                        ) : (

                          <span className="text-xs text-gray-500">
                            ○ Unassigned
                          </span>

                        )}

                      </td>


                      {/* Time */}
                      <td className="px-6 py-4 whitespace-nowrap">

                        <span className="text-xs text-gray-400">
                          {formatTime(
                            alert.timestamp
                          )}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}


          {/* Pagination */}
          {!loading && alerts.length > 0 && (

            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">

              <div className="text-xs text-gray-500">

                Showing page {page}

              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                >
                  ← Previous
                </button>

                <span className="px-3 py-2 text-sm text-gray-500">
                  {page}
                </span>

                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                >
                  Next →
                </button>

              </div>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}