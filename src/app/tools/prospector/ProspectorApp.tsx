"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Account, Workspace } from "@/lib/prospector/types";
import { AccountDetail, AccountRow } from "./AccountCard";
import { IcpEditor } from "./IcpEditor";
import { Learning } from "./Learning";
import { api, Button, setOwnerKey, timeAgo } from "./ui";

type State = {
  owner: boolean;
  setup: { storage: boolean; ownerKeySet: boolean; cronSet: boolean };
  workspace: Workspace | null;
};

type Tab = "accounts" | "icp" | "learning" | "activity";

export default function ProspectorApp() {
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>("accounts");
  const [toast, setToast] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await api<State>("state"));
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Couldn't load.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<State>("state")
      .then((s) => !cancelled && setState(s))
      .catch((e) => !cancelled && setLoadErr(e instanceof Error ? e.message : "Couldn't load."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const changed = useCallback(
    (msg?: string) => {
      if (msg) setToast(msg);
      load();
    },
    [load],
  );

  if (loadErr) return <Notice tone="warn">{loadErr}</Notice>;
  if (!state) return <p className="mt-10 text-sm text-muted">Loading…</p>;

  const { owner, setup, workspace: ws } = state;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${owner ? "bg-good-soft text-good" : "bg-accent-soft text-accent"}`}>
          {owner ? "Your workspace" : "Public demo · contact names hidden"}
        </span>
        <OwnerSignIn owner={owner} onChange={load} />
      </div>

      {!setup.storage && (
        <Notice tone="warn">
          The database isn&apos;t connected yet. In Vercel: Storage → Create Database → Upstash (free) → connect to this project, then redeploy.
        </Notice>
      )}

      {ws && (
        <>
          <nav className="mt-6 flex gap-1 border-b border-line text-sm">
            {(["accounts", "icp", "learning", ...(owner ? (["activity"] as const) : [])] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 ${tab === t ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}>
                {{ accounts: "Accounts", icp: "ICP & scoring", learning: "Learning", activity: "Activity" }[t]}
              </button>
            ))}
          </nav>
          <div className="mt-6">
            {tab === "accounts" && <Accounts ws={ws} owner={owner} onChanged={changed} />}
            {tab === "icp" && <IcpEditor key={ws.settings.updatedAt} settings={ws.settings} owner={owner} onSaved={changed} />}
            {tab === "learning" && <Learning ws={ws} />}
            {tab === "activity" && owner && <Activity ws={ws} cronSet={setup.cronSet} />}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90vw] rounded-lg bg-ink px-4 py-3 text-sm text-paper shadow-lg">{toast}</div>
      )}
    </div>
  );
}

// ---------------- Accounts tab ----------------

function Accounts({ ws, owner, onChanged }: { ws: Workspace; owner: boolean; onChanged: (msg?: string) => void }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [showHidden, setShowHidden] = useState(false);

  const regions = useMemo(() => uniq(ws.accounts.map((a) => a.region)), [ws.accounts]);
  const industries = useMemo(() => uniq(ws.accounts.map((a) => a.industry)), [ws.accounts]);

  const sorted = useMemo(() => {
    const order = (a: Account) => (a.status === "done" ? 0 : a.status === "researching" ? 1 : a.status === "queued" ? 2 : 3);
    return ws.accounts
      .filter((a) => showHidden || !a.hidden)
      .filter((a) => !region || a.region === region)
      .filter((a) => !industry || a.industry === industry)
      .filter((a) => a.status !== "done" || (a.score ?? 0) >= minScore)
      .filter((a) => !q || `${a.name} ${a.domain} ${a.research?.whyNow ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => order(a) - order(b) || (b.score ?? 0) - (a.score ?? 0));
  }, [ws.accounts, showHidden, region, industry, minScore, q]);

  const doneCount = sorted.filter((a) => a.status === "done").length;
  let rank = 0;

  return (
    <div className="space-y-5">
      {owner ? <OwnerToolbar ws={ws} onChanged={onChanged} /> : <TryLive ws={ws} />}

      {ws.accounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-40 rounded-lg border border-line bg-card px-3 py-1.5 outline-none focus:border-ink" />
          <Select value={region} onChange={setRegion} options={regions} all="All regions" />
          <Select value={industry} onChange={setIndustry} options={industries} all="All industries" />
          <label className="flex items-center gap-2 text-muted">
            Min score
            <input type="range" min={0} max={90} step={10} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
            <span className="w-6 font-mono text-xs">{minScore}</span>
          </label>
          {owner && (
            <label className="flex items-center gap-1.5 text-muted">
              <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Show hidden
            </label>
          )}
          <span className="ml-auto text-xs text-muted">{doneCount} ranked</span>
        </div>
      )}

      {ws.accounts.length === 0 ? (
        <Notice>
          {owner
            ? "No accounts yet. Set up your ICP in the ICP & scoring tab, then click Find new accounts."
            : "The demo list hasn't been published yet. Try a live analysis above."}
        </Notice>
      ) : (
        <ul className="space-y-3">
          {sorted.map((a) => (
            <AccountRow key={a.id} account={a} rank={a.status === "done" ? ++rank : undefined} rubric={ws.settings.rubric} owner={owner} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OwnerToolbar({ ws, onChanged }: { ws: Workspace; onChanged: (msg?: string) => void }) {
  const [count, setCount] = useState(6);
  const [phase, setPhase] = useState<null | "discover" | "research" | "publish" | "add">(null);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addDomain, setAddDomain] = useState("");
  const stop = useRef(false);

  async function researchLoop() {
    setPhase("research");
    stop.current = false;
    let n = 0;
    try {
      for (;;) {
        if (stop.current) break;
        setProgress(`Researching account ${n + 1}… (1–3 min each)`);
        const res = await api<{ account: Account | null; remaining: number }>("research-next", { method: "POST" });
        if (!res.account) break;
        n++;
        onChanged();
        if (res.remaining === 0) break;
      }
      onChanged(n ? `Researched ${n} account${n === 1 ? "" : "s"}.` : "Queue is empty.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPhase(null);
      setProgress("");
    }
  }

  async function discover() {
    setErr(null);
    setPhase("discover");
    setProgress("Searching the web for accounts that fit… (about 1–2 min)");
    try {
      const { added } = await api<{ added: Account[] }>("discover", { body: { count } });
      onChanged(`Found ${added.length} new accounts. Researching them now.`);
      if (added.length) await researchLoop();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPhase(null);
      setProgress("");
    }
  }

  async function add() {
    setErr(null);
    setPhase("add");
    try {
      await api("add", { body: { name: addName, domain: addDomain } });
      setAddName("");
      setAddDomain("");
      onChanged("Added to the queue.");
      await researchLoop();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setPhase(null);
    }
  }

  async function publish() {
    setErr(null);
    setPhase("publish");
    try {
      const { published } = await api<{ published: number }>("publish", { method: "POST" });
      onChanged(`Published ${published} accounts to the public demo (contact names hidden).`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPhase(null);
    }
  }

  const busy = phase !== null;
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={discover} disabled={busy}>Find new accounts</Button>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={busy} className="rounded-lg border border-line bg-card px-2 py-2 text-sm">
          {[3, 6, 10].map((n) => (
            <option key={n} value={n}>{n} accounts</option>
          ))}
        </select>
        {ws.queue.length > 0 && !busy && <Button onClick={researchLoop}>Research queue ({ws.queue.length})</Button>}
        {phase === "research" && <Button variant="ghost" onClick={() => (stop.current = true)}>Stop after this one</Button>}
        <span className="flex-1" />
        <Button variant="ghost" onClick={publish} disabled={busy}>{phase === "publish" ? "Publishing…" : "Publish to demo"}</Button>
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row">
        <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Add a specific company" className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink" />
        <input value={addDomain} onChange={(e) => setAddDomain(e.target.value)} placeholder="website (optional)" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink sm:w-48" />
        <Button onClick={add} disabled={busy || !addName.trim()}>Add & research</Button>
      </div>
      {progress && <p className="mt-3 flex items-center gap-2 text-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />{progress}</p>}
      {err && <p className="mt-3 text-sm text-warn">{err}</p>}
    </div>
  );
}

function TryLive({ ws }: { ws: Workspace }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Account | null>(null);
  const icp = ws.settings.icp;

  async function run() {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const { account } = await api<{ account: Account }>("try", { body: { name } });
      setResult(account);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <h3 className="font-semibold">Try it live</h3>
      <p className="mt-1 text-sm text-muted">
        Type any company. It researches it right now against this demo&apos;s ICP
        {icp.sellerCompany ? ` (selling ${icp.sellerCompany})` : ""} and scores it with sources. Takes 1–3 minutes.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Academy Sports + Outdoors" className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink" disabled={busy} />
        <Button type="submit" variant="primary" disabled={busy || !name.trim()}>{busy ? "Researching…" : "Research"}</Button>
      </form>
      {busy && <p className="mt-3 flex items-center gap-2 text-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />Searching news, filings and leadership pages…</p>}
      {err && <p className="mt-3 text-sm text-warn">{err}</p>}
      {result && (
        <div className="mt-4 rounded-xl border border-line">
          <div className="flex items-center gap-3 p-4">
            <span className="text-2xl font-semibold">{result.score}</span>
            <div>
              <p className="font-semibold">{result.name}</p>
              <p className="text-xs text-muted">{[result.industry, result.employees && `${result.employees} employees`, result.hq].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <AccountDetail account={result} rubric={ws.settings.rubric} owner={false} />
        </div>
      )}
    </div>
  );
}

// ---------------- Activity tab ----------------

function Activity({ ws, cronSet }: { ws: Workspace; cronSet: boolean }) {
  return (
    <div className="space-y-5">
      <Notice>
        {cronSet
          ? `Background run: nightly around 3am Central, ${ws.settings.nightlyAccounts} account${ws.settings.nightlyAccounts === 1 ? "" : "s"} per night (change it in ICP & scoring).`
          : "Background runs are off until CRON_SECRET is set in Vercel."}
      </Notice>
      {ws.runs.length === 0 ? (
        <p className="text-sm text-muted">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {ws.runs.map((r, i) => (
            <li key={i} className="flex items-start gap-3 p-3 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.ok ? "bg-good" : "bg-warn"}`} />
              <div className="flex-1">
                <p>{r.summary}</p>
                <p className="text-xs text-muted">{r.kind} · {r.trigger} · {timeAgo(r.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------- bits ----------------

function OwnerSignIn({ owner, onChange }: { owner: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [tried, setTried] = useState(false);

  if (owner) {
    return (
      <Button variant="ghost" onClick={() => { setOwnerKey(""); onChange(); }}>Sign out</Button>
    );
  }
  return open ? (
    <form onSubmit={(e) => { e.preventDefault(); setOwnerKey(key); setTried(true); setOpen(false); onChange(); }} className="flex gap-2">
      <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Owner key" className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm outline-none focus:border-ink" autoFocus />
      <Button type="submit">Sign in</Button>
    </form>
  ) : (
    <Button variant="ghost" onClick={() => setOpen(true)}>{tried ? "Wrong key, try again" : "Owner sign-in"}</Button>
  );
}

function Select({ value, onChange, options, all }: { value: string; onChange: (v: string) => void; options: string[]; all: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line bg-card px-2 py-1.5">
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return <div className={`mt-4 rounded-xl border p-4 text-sm ${tone === "warn" ? "border-warn/30 bg-warn-soft" : "border-line bg-card text-muted"}`}>{children}</div>;
}

function uniq(xs: string[]) {
  return [...new Set(xs.filter(Boolean))].sort();
}
