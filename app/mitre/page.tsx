"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMitreCoverage,
  getMitreStats,
  getMitreTechniques,
} from "../../lib/api";

interface MitreTechnique {
  id: number;
  technique_id: string;
  name: string;
  tactic: string;
  description: string | null;
}

interface MitreResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MitreTechnique[];
}

interface MitreCoverage {
  total_rules: number;
  mapped_rules: number;
  coverage_percent: number;
}

interface MitreStats {
  total_techniques: number;
  total_tactics: number;
}

export default function MitrePage() {
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [coverage, setCoverage] = useState<MitreCoverage | null>(null);
  const [stats, setStats] = useState<MitreStats | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [tacticFilter, setTacticFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadMitre(currentPage = page, showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [techniqueData, coverageData, statsData] =
        await Promise.all([
          getMitreTechniques(currentPage),
          getMitreCoverage(),
          getMitreStats(),
        ]);

      setTechniques(techniqueData.results || []);
      setCoverage(coverageData);
      setStats(statsData);

      setTotalPages(
        Math.max(1, Math.ceil(techniqueData.count / 10))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load MITRE ATT&CK data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMitre(page);
  }, [page]);

  const tactics = useMemo(() => {
    return Array.from(
      new Set(techniques.map((technique) => technique.tactic))
    ).sort();
  }, [techniques]);

  const filteredTechniques = useMemo(() => {
    return techniques.filter((technique) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        technique.technique_id.toLowerCase().includes(searchText) ||
        technique.name.toLowerCase().includes(searchText) ||
        technique.tactic.toLowerCase().includes(searchText);

      const matchesTactic =
        tacticFilter === "ALL" ||
        technique.tactic === tacticFilter;

      return matchesSearch && matchesTactic;
    });
  }, [techniques, search, tacticFilter]);

  function getTacticClass(tactic: string) {
    switch (tactic) {
      case "Credential Access":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "Execution":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";

      case "Persistence":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";

      case "Privilege Escalation":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      case "Defense Evasion":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "Lateral Movement":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

      case "Impact":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            MITRE ATT&CK
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Security detection coverage mapped to MITRE ATT&CK techniques
          </p>
        </div>

        <button
          onClick={() => loadMitre(page, true)}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm transition disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Total Techniques
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats?.total_techniques ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Total Tactics
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats?.total_tactics ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Mapped Rules
          </p>

          <p className="text-3xl font-bold mt-2">
            {coverage?.mapped_rules ?? "-"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            of {coverage?.total_rules ?? "-"} rules
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Coverage
          </p>

          <p className="text-3xl font-bold mt-2">
            {coverage
              ? `${coverage.coverage_percent}%`
              : "-"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Search
            </label>

            <input
              type="text"
              placeholder="Search technique ID, name or tactic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          {/* Tactic */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Tactic
            </label>

            <select
              value={tacticFilter}
              onChange={(e) => setTacticFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            >
              <option value="ALL">
                All Tactics
              </option>

              {tactics.map((tactic) => (
                <option key={tactic} value={tactic}>
                  {tactic}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold">
            MITRE Techniques
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Showing {filteredTechniques.length} techniques on this page
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Loading MITRE ATT&CK data...
          </div>
        ) : filteredTechniques.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No techniques found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-5 py-4 font-medium">
                    ID
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Technique
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Tactic
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Description
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTechniques.map((technique) => (
                  <tr
                    key={technique.id}
                    className="border-b border-slate-800/70 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-cyan-400">
                        {technique.technique_id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">
                        {technique.name}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getTacticClass(
                          technique.tactic
                        )}`}
                      >
                        {technique.tactic}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-400 max-w-md">
                      {technique.description || "No description available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <button
            onClick={() => setPage((current) => current - 1)}
            disabled={page === 1 || loading}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={page >= totalPages || loading}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}