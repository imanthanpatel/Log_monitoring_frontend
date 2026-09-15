"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAlert } from "../../../lib/api";

interface MitreTechnique {
  id: number;
  technique_id: string;
  name: string;
  tactic: string;
  description: string | null;
}

interface AlertData {
  id: number;
  rule_name: string;
  severity: string;
  description: string;
  status: string;
  assigned: boolean;
  timestamp: string;
  mitre_technique: MitreTechnique | null;
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [alert, setAlert] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    const loadAlert = async () => {
      try {
        const id = Number(params.id);

        if (!id) {
          throw new Error("Invalid alert ID");
        }

        const data = await getAlert(id);
        setAlert(data);
      } catch (err: any) {
        setError(err.message || "Failed to load alert");
      } finally {
        setLoading(false);
      }
    };

    loadAlert();
  }, [params.id, router]);

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";

      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";

      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

      case "Low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";

      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-500/20 text-red-400";

      case "ASSIGNED":
        return "bg-blue-500/20 text-blue-400";

      case "CLOSED":
        return "bg-green-500/20 text-green-400";

      case "RESOLVED":
        return "bg-green-500/20 text-green-400";

      case "FALSE_POSITIVE":
        return "bg-gray-500/20 text-gray-400";

      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
        <div className="text-gray-400">
          Loading alert...
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white p-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400">
            Unable to load alert
          </h2>

          <p className="text-gray-400 mt-2">
            {error || "Alert not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">

      {/* Top Header */}
      <header className="border-b border-gray-800 bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white text-sm mb-1"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold">
              Alert #{alert.id}
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${getSeverityClass(
                alert.severity
              )}`}
            >
              {alert.severity}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                alert.status
              )}`}
            >
              {alert.status}
            </span>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Rule */}
        <section className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Detection Rule
              </p>

              <h2 className="text-xl font-semibold mt-1">
                {alert.rule_name}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Detected
              </p>

              <p className="text-sm text-gray-300 mt-1">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>

          </div>

        </section>

        {/* Description */}
        <section className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">

          <h2 className="text-lg font-semibold mb-4">
            Alert Description
          </h2>

          <div className="bg-[#0a0f1c] border border-gray-800 rounded-lg p-5">
            <p className="text-gray-300 leading-7 whitespace-pre-wrap">
              {alert.description}
            </p>
          </div>

        </section>

        {/* MITRE */}
        <section className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">

          <h2 className="text-lg font-semibold mb-4">
            MITRE ATT&CK
          </h2>

          {alert.mitre_technique ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="bg-[#0a0f1c] border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                  Technique ID
                </p>

                <p className="text-blue-400 font-semibold mt-2">
                  {alert.mitre_technique.technique_id}
                </p>
              </div>

              <div className="bg-[#0a0f1c] border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                  Technique
                </p>

                <p className="text-gray-200 font-medium mt-2">
                  {alert.mitre_technique.name}
                </p>
              </div>

              <div className="bg-[#0a0f1c] border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                  Tactic
                </p>

                <p className="text-gray-200 font-medium mt-2">
                  {alert.mitre_technique.tactic}
                </p>
              </div>

            </div>
          ) : (
            <p className="text-gray-500">
              No MITRE ATT&CK technique mapped to this alert.
            </p>
          )}

        </section>

        {/* Alert Information */}
        <section className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">

          <h2 className="text-lg font-semibold mb-4">
            Alert Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Alert ID
              </p>

              <p className="mt-1 font-medium">
                #{alert.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Severity
              </p>

              <p className="mt-1 font-medium">
                {alert.severity}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Assignment
              </p>

              <p className="mt-1 font-medium">
                {alert.assigned
                  ? "Assigned"
                  : "Not Assigned"}
              </p>
            </div>

          </div>

        </section>

        {/* Actions */}
        <section className="flex gap-3">

          <button
            onClick={() => router.push("/alerts")}
            className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          >
            All Alerts
          </button>

          {alert.status === "ASSIGNED" && (
            <button
              onClick={() =>
                router.push(
                  `/investigations`
                )
              }
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
            >
              View Investigations
            </button>
          )}

        </section>

      </main>
    </div>
  );
}