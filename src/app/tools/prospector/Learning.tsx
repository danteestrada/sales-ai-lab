"use client";

import type { Workspace } from "@/lib/prospector/types";
import { timeAgo } from "./ui";

// What the tool has learned, and how accurate it's been. All numbers come from stored data.
export function Learning({ ws }: { ws: Workspace }) {
  const done = ws.accounts.filter((a) => a.research);
  const up = ws.accounts.filter((a) => a.feedback?.verdict === "up").length;
  const down = ws.accounts.filter((a) => a.feedback?.verdict === "down").length;
  const contacts = done.flatMap((a) => a.research!.contacts);
  const checked = contacts.filter((c) => c.check);
  const correct = checked.filter((c) => c.check === "correct").length;
  const conf = { high: 0, medium: 0, low: 0 };
  contacts.forEach((c) => conf[c.confidence]++);
  const maxW = Math.max(...ws.settings.rubric.map((c) => c.weight), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Accounts researched" value={String(done.length)} />
        <Stat label="Your feedback" value={`${up} 👍 · ${down} 👎`} />
        <Stat
          label="Contact accuracy (spot-checked)"
          value={checked.length ? `${Math.round((correct / checked.length) * 100)}%` : "—"}
          note={checked.length ? `${correct} of ${checked.length} confirmed still in role` : "Spot-check contacts to measure this"}
        />
        <Stat label="Contact confidence" value={`${conf.high} high · ${conf.medium} med · ${conf.low} low`} note="From how recent the source is" />
      </div>

      <section>
        <h3 className="font-semibold">Current weights</h3>
        <p className="text-sm text-muted">Started from the default rubric; moves with every 👍/👎.</p>
        <ul className="mt-4 space-y-2">
          {ws.settings.rubric.map((c) => (
            <li key={c.id} className="grid grid-cols-[140px_1fr_52px] items-center gap-3 text-sm">
              <span className="truncate">{c.name}</span>
              <span className="h-3 rounded-sm bg-line">
                <span className="block h-3 rounded-sm bg-accent" style={{ width: `${(c.weight / maxW) * 100}%` }} />
              </span>
              <span className="text-right font-mono tabular-nums">{c.weight}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">What it learned from you</h3>
        {ws.weightLog.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No feedback yet. Give a 👍 or 👎 on an account and the weight changes will show here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
            {ws.weightLog.map((w, i) => (
              <li key={i} className="p-3 text-sm">
                <p>
                  {w.verdict === "up" ? "👍" : "👎"} <span className="font-medium">{w.account}</span> <span className="text-muted">· {timeAgo(w.at)}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{w.changes.map((c) => `${c.name} ${c.from}% → ${c.to}%`).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
