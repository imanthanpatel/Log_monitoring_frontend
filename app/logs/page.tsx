"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getLogs } from "../../lib/api";

interface Log {
  id: number;
  event_id: number;
  source: string;
  log_type: string;
  message: string;
  keyword: string | null;
  computer: string | null;
  username: string | null;
  ip_address: string | null;
  time_generated: string;
  timestamp: string;
}

interface LogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Log[];
}

const LOG_TYPES = [
  "ALL",
  "Security",
  "System",
  "Application",
  "PowerShell",
];

export default function LogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<Log[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [search, setSearch] = useState("");
  const [logType, setLogType] = useState("ALL");
  const [eventId, setEventId] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async (
    selectedPage = page,
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data: LogsResponse = await getLogs(selectedPage);

      setLogs(data.results || []);
      setTotalCount(data.count || 0);

      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));
      setPage(selectedPage);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load logs";

      setError(message);

      if (message === "Session expired") {
        router.push("/login");
      }
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

    loadLogs(1);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(log.id).includes(searchText) ||
        String(log.event_id).includes(searchText) ||
        log.source?.toLowerCase().includes(searchText) ||
        log.log_type?.toLowerCase().includes(searchText) ||
        log.message?.toLowerCase().includes(searchText) ||
        log.computer?.toLowerCase().includes(searchText) ||
        log.username?.toLowerCase().includes(searchText) ||
        log.ip_address?.toLowerCase().includes(searchText);

      const matchesLogType =
        logType === "ALL" ||
        log.log_type === logType;

      const matchesEventId =
        !eventId ||
        String(log.event_id).includes(eventId.trim());

      return (
        matchesSearch &&
        matchesLogType &&
        matchesEventId
      );
    });
  }, [logs, search, logType, eventId]);

  const securityCount = logs.filter(
    (log) => log.log_type === "Security"
  ).length;

  const systemCount = logs.filter(
    (log) => log.log_type === "System"
  ).length;

  const applicationCount = logs.filter(
    (log) => log.log_type === "Application"
  ).length;

  const powershellCount = logs.filter(
    (log) => log.log_type === "PowerShell"
  ).length;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setSearch("");
    setLogType("ALL");
    setEventId("");
  };

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#090c12]">
        <div className="flex items-center justify-between px-8 py-5">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                ← Dashboard
              </button>

              <div className="h-6 w-px bg-white/10" />

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Security Logs
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Windows event log monitoring and analysis
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => loadLogs(page, true)}
            disabled={refreshing}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </header>

      <div className="px-8 py-7">
        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Logs"
            value={totalCount.toLocaleString()}
            icon="▤"
          />

          <StatCard
            title="Security"
            value={securityCount}
            icon="◉"
          />

          <StatCard
            title="System"
            value={systemCount}
            icon="⚙"
          />

          <StatCard
            title="Application"
            value={applicationCount}
            icon="▣"
          />

          <StatCard
            title="PowerShell"
            value={powershellCount}
            icon="⌘"
          />
        </section>

        {/* Filters */}
        <section className="mt-6 rounded-xl border border-white/10 bg-[#090c12] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Log Explorer
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Search and filter the currently loaded page
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Search */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, user, IP, computer, message..."
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/30"
              />
            </div>

            {/* Log type */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Log Type
              </label>

              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {LOG_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    className="bg-[#090c12]"
                  >
                    {type === "ALL" ? "All Log Types" : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Event ID */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Event ID
              </label>

              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Example: 4688"
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/30"
              />
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Logs table */}
        <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#090c12]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold">
                Event Logs
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Showing {filteredLogs.length} of{" "}
                {logs.length} logs on page {page}
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              Page {page}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading security logs...
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="text-3xl">⌕</div>

                <p className="mt-3 text-sm font-medium text-gray-300">
                  No logs found
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  Try changing your search or filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4">
                      ID
                    </th>

                    <th className="px-5 py-4">
                      Event
                    </th>

                    <th className="px-5 py-4">
                      Log Type
                    </th>

                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Source IP
                    </th>

                    <th className="px-5 py-4">
                      Computer
                    </th>

                    <th className="px-5 py-4">
                      Source
                    </th>

                    <th className="px-5 py-4">
                      Message
                    </th>

                    <th className="px-5 py-4">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >
                      {/* ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-300">
                          #{log.id}
                        </span>
                      </td>

                      {/* Event ID */}
                      <td className="px-5 py-4">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-gray-300">
                          {log.event_id}
                        </span>
                      </td>

                      {/* Log type */}
                      <td className="px-5 py-4">
                        <LogTypeBadge
                          type={log.log_type}
                        />
                      </td>

                      {/* Username */}
                      <td className="px-5 py-4">
                        <div className="max-w-[150px] truncate text-sm text-gray-300">
                          {log.username || (
                            <span className="text-gray-600">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-4">
                        {log.ip_address ? (
                          <span className="font-mono text-xs text-gray-300">
                            {log.ip_address}
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            —
                          </span>
                        )}
                      </td>

                      {/* Computer */}
                      <td className="px-5 py-4">
                        <div className="max-w-[160px] truncate text-xs text-gray-400">
                          {log.computer || "—"}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4">
                        <div
                          className="max-w-[220px] truncate text-xs text-gray-500"
                          title={log.source}
                        >
                          {log.source}
                        </div>
                      </td>

                      {/* Message */}
                      <td className="px-5 py-4">
                        <div
                          className="max-w-[360px] truncate text-xs text-gray-400"
                          title={log.message}
                        >
                          {log.message}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-4">
                        <div className="whitespace-nowrap text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <div className="text-xs text-gray-500">
              Total: {totalCount.toLocaleString()} logs
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrevious || loading}
                onClick={() => loadLogs(page - 1)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400">
                Page {page}
              </span>

              <button
                disabled={!hasNext || loading}
                onClick={() => loadLogs(page + 1)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* -----------------------------
   Stat Card
------------------------------ */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#090c12] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Log Type Badge
------------------------------ */

function LogTypeBadge({
  type,
}: {
  type: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300">
      {type}
    </span>
  );
}