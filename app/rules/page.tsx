"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRules } from "../../lib/api";

interface Rule {
  id: number;
  name: string;
  severity: string;
  enabled: boolean;
  mitre: number | null;
  mitre_id: string | null;
  mitre_name: string | null;
}

interface RulesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rule[];
}

const SEVERITIES = [
  "ALL",
  "Critical",
  "High",
  "Medium",
  "Low",
];

const STATUS_OPTIONS = [
  "ALL",
  "ENABLED",
  "DISABLED",
];

export default function RulesPage() {
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRules = async (
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

      const data: RulesResponse =
        await getRules(selectedPage);

      setRules(data.results || []);
      setTotalCount(data.count || 0);

      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));

      setPage(selectedPage);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load detection rules";

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

    loadRules(1);
  }, []);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        String(rule.id).includes(searchText) ||
        rule.name
          ?.toLowerCase()
          .includes(searchText) ||
        rule.mitre_id
          ?.toLowerCase()
          .includes(searchText) ||
        rule.mitre_name
          ?.toLowerCase()
          .includes(searchText);

      const matchesSeverity =
        severity === "ALL" ||
        rule.severity === severity;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ENABLED" &&
          rule.enabled === true) ||
        (statusFilter === "DISABLED" &&
          rule.enabled === false);

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [
    rules,
    search,
    severity,
    statusFilter,
  ]);

  const enabledCount = rules.filter(
    (rule) => rule.enabled
  ).length;

  const disabledCount = rules.filter(
    (rule) => !rule.enabled
  ).length;

  const criticalCount = rules.filter(
    (rule) => rule.severity === "Critical"
  ).length;

  const highCount = rules.filter(
    (rule) => rule.severity === "High"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setSeverity("ALL");
    setStatusFilter("ALL");
  };

  return (
    <main className="min-h-screen bg-[#05070b] text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-[#090c12]">
        <div className="flex items-center justify-between px-8 py-5">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Dashboard
            </button>

            <div className="h-6 w-px bg-white/10" />

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Detection Rules
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Security detection and alert generation rules
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              loadRules(page, true)
            }
            disabled={refreshing}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>
      </header>

      <div className="px-8 py-7">

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total Rules"
            value={totalCount}
            icon="⚙"
          />

          <StatCard
            title="Enabled"
            value={enabledCount}
            icon="✓"
          />

          <StatCard
            title="Disabled"
            value={disabledCount}
            icon="○"
          />

          <StatCard
            title="Critical"
            value={criticalCount}
            icon="!"
          />

          <StatCard
            title="High"
            value={highCount}
            icon="▲"
          />

        </section>

        {/* Filters */}
        <section className="mt-6 rounded-xl border border-white/10 bg-[#090c12] p-5">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Rule Explorer
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Search and filter detection rules
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search rule or MITRE..."
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/30"
              />

            </div>

            {/* Severity */}
            <div>

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Severity
              </label>

              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {SEVERITIES.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#090c12]"
                  >
                    {item === "ALL"
                      ? "All Severities"
                      : item}
                  </option>
                ))}
              </select>

            </div>

            {/* Status */}
            <div>

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-[#05070b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#090c12]"
                  >
                    {item === "ALL"
                      ? "All Statuses"
                      : item}
                  </option>
                ))}
              </select>

            </div>

          </div>

        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Rules Table */}
        <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#090c12]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <div>
              <h2 className="font-semibold">
                Detection Rules
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Showing {filteredRules.length} of{" "}
                {rules.length} rules on page {page}
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              Page {page}
            </div>

          </div>

          {loading ? (

            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading detection rules...
              </div>
            </div>

          ) : filteredRules.length === 0 ? (

            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">

                <div className="text-3xl">
                  ⚙
                </div>

                <p className="mt-3 text-sm font-medium text-gray-300">
                  No detection rules found
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  Try changing your filters.
                </p>

              </div>
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left">

                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">

                    <th className="px-5 py-4">
                      ID
                    </th>

                    <th className="px-5 py-4">
                      Detection Rule
                    </th>

                    <th className="px-5 py-4">
                      Severity
                    </th>

                    <th className="px-5 py-4">
                      MITRE ATT&CK
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredRules.map((rule) => (

                    <tr
                      key={rule.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >

                      {/* ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-400">
                          #{rule.id}
                        </span>
                      </td>

                      {/* Rule */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-200">
                          {rule.name}
                        </div>

                      </td>

                      {/* Severity */}
                      <td className="px-5 py-4">
                        <SeverityBadge
                          severity={rule.severity}
                        />
                      </td>

                      {/* MITRE */}
                      <td className="px-5 py-4">

                        {rule.mitre_id ? (

                          <div>

                            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-gray-300">
                              {rule.mitre_id}
                            </span>

                            {rule.mitre_name && (
                              <p className="mt-2 text-xs text-gray-500">
                                {rule.mitre_name}
                              </p>
                            )}

                          </div>

                        ) : (

                          <span className="text-xs text-gray-600">
                            Not mapped
                          </span>

                        )}

                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">

                        {rule.enabled ? (

                          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                            Enabled
                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-500/20 bg-gray-500/10 px-3 py-1.5 text-xs font-medium text-gray-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Disabled
                          </span>

                        )}

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
              Total: {totalCount} detection rules
            </div>

            <div className="flex items-center gap-2">

              <button
                disabled={!hasPrevious || loading}
                onClick={() =>
                  loadRules(page - 1)
                }
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400">
                Page {page}
              </span>

              <button
                disabled={!hasNext || loading}
                onClick={() =>
                  loadRules(page + 1)
                }
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

/* --------------------------------
   Stat Card
--------------------------------- */

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

/* --------------------------------
   Severity Badge
--------------------------------- */

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const styles: Record<string, string> = {
    Critical:
      "border-red-500/20 bg-red-500/10 text-red-400",

    High:
      "border-orange-500/20 bg-orange-500/10 text-orange-400",

    Medium:
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

    Low:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${
        styles[severity] ||
        "border-white/10 bg-white/5 text-gray-400"
      }`}
    >
      {severity}
    </span>
  );
}