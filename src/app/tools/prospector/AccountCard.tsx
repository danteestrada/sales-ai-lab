"use client";

import { useState } from "react";
import { FEEDBACK_REASONS } from "@/lib/prospector/defaults";
import type { Account, Criterion, WeightChange } from "@/lib/prospector/types";
import { api, Button, ConfidenceChip, host, prettyDate, ScoreBadge, timeAgo } from "./ui";

export function AccountRow({
  account,
  rank,
  rubric,
  owner,
  onChanged,
  defaultOpen = false,
}: {
  account: Account;
  rank?: number;
  rubric: Criterion[];
  owner: boolean;
  onChanged?: (msg?: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const r = account.research;
  const status = account.status;

  return (
    <li className={`rounded-xl border bg-card ${account.hidden ? "border-dashed border-line opacity-60" : "border-line"}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-4 p-4 text-left">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
          {status === "done" ? <ScoreBadge score={account.score} /> : <StatusDot status={status} />}
          {rank !== undefined && status === "done" && <span className="font-mono text-[11px] text-muted">#{rank}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{account.name}</span>
            {account.domain && <span className="text-sm text-muted">{account.domain}</span>}
            {account.feedback && <span className="text-sm">{account.feedback.verdict === "up" ? "👍" : "👎"}</span>}
            {r?.disqualified && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">disqualified</span>}
          </div>
          <p className="text-xs text-muted">{[account.industry, account.employees && `${account.employees} employees`, account.hq || account.region].filter(Boolean).join(" · ")}</p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed">
            {status === "done" ? r?.whyNow : status === "error" ? `Research failed: ${account.error}` : account.discoveryReason}
          </p>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-muted sm:block">
          {r ? (
            <>
              <p>{r.contacts.length} contact{r.contacts.length === 1 ? "" : "s"}</p>
              <p>{timeAgo(r.researchedAt)}</p>
            </>
          ) : (
            <p>{status === "researching" ? "researching…" : status}</p>
          )}
        </div>
      </button>
      {open && <AccountDetail account={account} rubric={rubric} owner={owner} onChanged={onChanged} />}
    </li>
  );
}

function StatusDot({ status }: { status: Account["status"] }) {
  const tone = status === "error" ? "bg-warn" : status === "researching" ? "animate-pulse bg-accent" : "bg-line";
  return (
    <span className="flex h-10 w-10 items-center justify-center">
      <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
    </span>
  );
}

export function AccountDetail({
  account,
  rubric,
  owner,
  onChanged,
}: {
  account: Account;
  rubric: Criterion[];
  owner: boolean;
  onChanged?: (msg?: string) => void;
}) {
  const r = account.research;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(body: Record<string, unknown>, msg?: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await api<{ change?: WeightChange | null }>("account", { body: { id: account.id, ...body } });
      let note = msg;
      if (res.change?.changes.length) {
        note = `Learned from that. ${res.change.changes.map((c) => `${c.name} ${c.from}% → ${c.to}%`).join(", ")}`;
      }
      onChanged?.(note);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!r) {
    return (
      <div className="border-t border-line p-4 text-sm text-muted">
        {account.status === "error" ? (
          <div className="flex flex-wrap items-center gap-3">
            <span>Research failed: {account.error}</span>
            {owner && <Button onClick={() => act({ action: "rerun" }, `Re-researched ${account.name}.`)} disabled={busy}>{busy ? "Researching… (1–3 min)" : "Try again"}</Button>}
          </div>
        ) : (
          <>Waiting in the research queue. Found because: {account.discoveryReason}</>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 border-t border-line p-4 md:p-6">
      {r.disqualified && (
        <div className="rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm">
          <span className="font-semibold">Disqualified:</span> {r.disqualifiedReason}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Block title="Why now">{r.whyNow}</Block>
        <Block title="Why not">{r.whyNot}</Block>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Score breakdown</h4>
        <ul className="space-y-3">
          {rubric.map((c) => {
            const s = r.criteria.find((x) => x.id === c.id);
            return (
              <li key={c.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {c.name} <span className="font-normal text-muted">· weight {c.weight}%</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`h-2 w-5 rounded-sm ${s && s.score >= n ? "bg-accent" : "bg-line"}`} />
                      ))}
                    </span>
                    <span className="w-8 text-right font-mono text-xs tabular-nums">{s ? `${s.score}/5` : "—"}</span>
                  </span>
                </div>
                {s && <p className="mt-1.5 text-sm text-muted">{s.reasoning}</p>}
                {s && s.evidence.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {s.evidence.map((ev, i) => (
                      <li key={i} className="text-xs">
                        <span>{ev.fact}</span>{" "}
                        <span className="text-muted">({prettyDate(ev.date)})</span>{" "}
                        {ev.url?.startsWith("http") && (
                          <a href={ev.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            {host(ev.url)}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Contacts</h4>
          {r.contacts.length === 0 ? (
            <p className="text-sm text-muted">No named buyers found in public sources. Target: {r.personasToTarget.join(", ") || "see personas"}.</p>
          ) : (
            <ul className="space-y-2">
              {r.contacts.map((c, i) => (
                <li key={i} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted">{c.title}</p>
                    </div>
                    <ConfidenceChip c={c.confidence} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Named in this role {prettyDate(c.sourceDate)} ·{" "}
                    {c.sourceUrl?.startsWith("http") ? (
                      <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {host(c.sourceUrl)}
                      </a>
                    ) : (
                      "no link"
                    )}
                  </p>
                  {owner && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-muted">Spot-check:</span>
                      {(["correct", "wrong"] as const).map((v) => (
                        <button
                          key={v}
                          disabled={busy}
                          onClick={() => act({ action: "contact", index: i, check: c.check === v ? null : v })}
                          className={`rounded border px-2 py-0.5 ${c.check === v ? (v === "correct" ? "border-good bg-good-soft text-good" : "border-warn bg-warn-soft text-warn") : "border-line hover:border-ink"}`}
                        >
                          {v === "correct" ? "Still there ✓" : "Wrong ✗"}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-5">
          <Block title="Personas to target">{r.personasToTarget.join(" · ") || "—"}</Block>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Suggested opener</h4>
            <p className="rounded-lg bg-paper p-3 text-sm italic leading-relaxed">“{r.opener}”</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Researched {timeAgo(r.researchedAt)} · {r.searchesUsed} web searches · score computed from your rubric weights, not by the AI
      </p>

      {owner && <OwnerActions account={account} busy={busy} act={act} />}
      {err && <p className="text-sm text-warn">{err}</p>}
    </div>
  );
}

function OwnerActions({
  account,
  busy,
  act,
}: {
  account: Account;
  busy: boolean;
  act: (body: Record<string, unknown>, msg?: string) => Promise<void>;
}) {
  const [verdict, setVerdict] = useState<"up" | "down" | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium">Teach it:</span>
        <Button onClick={() => { setVerdict("up"); setReasons([]); }} variant={verdict === "up" ? "primary" : "secondary"}>👍 Good account</Button>
        <Button onClick={() => { setVerdict("down"); setReasons([]); }} variant={verdict === "down" ? "primary" : "secondary"}>👎 Not for me</Button>
        <span className="flex-1" />
        <Button variant="ghost" disabled={busy} onClick={() => act({ action: account.hidden ? "unhide" : "hide" })}>{account.hidden ? "Unhide" : "Hide"}</Button>
        <Button variant="ghost" disabled={busy} onClick={() => act({ action: "rerun" }, `Re-researched ${account.name}.`)}>{busy ? "Working…" : "Re-research"}</Button>
      </div>
      {verdict && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_REASONS[verdict].map((r) => (
              <button
                key={r}
                onClick={() => setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))}
                className={`rounded-full border px-3 py-1 text-xs ${reasons.includes(r) ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why? (optional, but it gets fed into future searches)"
            rows={2}
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <Button variant="accent" disabled={busy} onClick={() => act({ action: "feedback", verdict, reasons, note }).then(() => setVerdict(null))}>
            {busy ? "Saving…" : "Save feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold">{title}</h4>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
