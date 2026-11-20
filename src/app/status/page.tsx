"use client";

import { useState } from "react";

type Result = { status: string; message?: string; reply?: string };

export default function Status() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/health");
      setResult(await res.json());
    } catch {
      setResult({ status: "error", message: "Couldn't reach the server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">AI status</h1>
      <p className="mt-3 text-muted">Checks that the site can reach Claude. Each check costs a fraction of a cent.</p>
      <button
        onClick={check}
        disabled={loading}
        className="mt-6 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Run check"}
      </button>
      {result && (
        <div
          className={`mt-6 rounded-xl border p-5 ${
            result.status === "connected" ? "border-good/30 bg-good-soft" : "border-warn/30 bg-warn-soft"
          }`}
        >
          <p className="font-semibold">{result.status === "connected" ? "Connected" : "Not connected"}</p>
          {result.message && <p className="mt-1 text-sm">{result.message}</p>}
        </div>
      )}
    </div>
  );
}
