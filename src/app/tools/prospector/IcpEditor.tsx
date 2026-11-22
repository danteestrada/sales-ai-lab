"use client";

import { useState } from "react";
import type { Criterion, Icp, Settings } from "@/lib/prospector/types";
import { api, Button } from "./ui";

const listToText = (l: string[]) => l.join("\n");
const textToList = (t: string) =>
  t
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);

export function IcpEditor({ settings, owner, onSaved }: { settings: Settings; owner: boolean; onSaved: (msg: string) => void }) {
  const [icp, setIcp] = useState<Icp>(settings.icp);
  const [rubric, setRubric] = useState<Criterion[]>(settings.rubric);
  const [nightly, setNightly] = useState(settings.nightlyAccounts);
  const [site, setSite] = useState("");
  const [busy, setBusy] = useState<null | "save" | "draft">(null);
  const [err, setErr] = useState<string | null>(null);
  const total = Math.round(rubric.reduce((a, c) => a + (Number(c.weight) || 0), 0) * 10) / 10;

  const ro = !owner;
  const set = <K extends keyof Icp>(key: K, v: Icp[K]) => setIcp((s) => ({ ...s, [key]: v }));

  async function draft() {
    setBusy("draft");
    setErr(null);
    try {
      const { icp: d } = await api<{ icp: Partial<Icp> }>("draft-icp", { body: { url: site } });
      setIcp((s) => ({
        ...s,
        ...Object.fromEntries(Object.entries(d).filter(([, v]) => (Array.isArray(v) ? v.length : v !== undefined && v !== ""))),
      }));
      onSaved("Drafted from your website. Review it, then Save.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setErr(null);
    try {
      const { settings: s } = await api<{ settings: Settings }>("settings", { body: { icp, rubric, nightlyAccounts: nightly } });
      setRubric(s.rubric);
      onSaved("Saved. Scores were recalculated with the new weights.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {owner && (
        <div className="rounded-xl border border-line bg-card p-5">
          <h3 className="font-semibold">Start from your company&apos;s website</h3>
          <p className="mt-1 text-sm text-muted">Paste the site of the company you sell for. It drafts the ICP below; you edit and save.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. databricks.com" className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink" />
            <Button onClick={draft} disabled={!site.trim() || busy !== null}>{busy === "draft" ? "Drafting… (~30s)" : "Draft ICP"}</Button>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Who you sell for" value={icp.sellerCompany} onChange={(v) => set("sellerCompany", v)} ro={ro} />
        <Field label="What you sell (1–2 sentences)" value={icp.whatYouSell} onChange={(v) => set("whatYouSell", v)} ro={ro} multiline />
        <Field label="Target industries (one per line)" value={listToText(icp.industries)} onChange={(v) => set("industries", textToList(v))} ro={ro} multiline />
        <Field label="Regions (one per line, e.g. Texas, United States, UK)" value={listToText(icp.regions)} onChange={(v) => set("regions", textToList(v))} ro={ro} multiline />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min employees" value={String(icp.sizeMin)} onChange={(v) => set("sizeMin", Number(v.replace(/\D/g, "")) || 0)} ro={ro} />
          <Field label="Max employees" value={String(icp.sizeMax)} onChange={(v) => set("sizeMax", Number(v.replace(/\D/g, "")) || 0)} ro={ro} />
        </div>
        <Field label="Buyer personas (titles, one per line)" value={listToText(icp.personas)} onChange={(v) => set("personas", textToList(v))} ro={ro} multiline />
        <Field label="Disqualifiers (one per line)" value={listToText(icp.disqualifiers)} onChange={(v) => set("disqualifiers", textToList(v))} ro={ro} multiline />
        <Field label="Notes for the AI (triggers, things to avoid, context)" value={icp.notes} onChange={(v) => set("notes", v)} ro={ro} multiline />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Scoring rubric</h3>
          <span className={`font-mono text-xs ${Math.abs(total - 100) < 0.5 ? "text-muted" : "text-warn"}`}>total {total}%{owner && Math.abs(total - 100) >= 0.5 ? " · rebalanced to 100 on save" : ""}</span>
        </div>
        <p className="mt-1 text-sm text-muted">The AI scores each item 0–5 with evidence. The final score is calculated from these weights. Your 👍/👎 feedback adjusts them over time.</p>
        <ul className="mt-4 space-y-3">
          {rubric.map((c, i) => (
            <li key={c.id} className="grid gap-2 rounded-lg border border-line bg-card p-3 md:grid-cols-[1fr_2fr_90px_auto]">
              <input disabled={ro} value={c.name} onChange={(e) => setRubric((r) => r.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="rounded-md border border-line bg-paper px-2 py-1 text-sm font-medium disabled:border-transparent disabled:bg-transparent" />
              <textarea disabled={ro} rows={2} value={c.description} onChange={(e) => setRubric((r) => r.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} className="rounded-md border border-line bg-paper px-2 py-1 text-sm disabled:border-transparent disabled:bg-transparent" />
              <label className="flex items-center gap-1 text-sm">
                <input disabled={ro} type="number" min={0} max={100} value={c.weight} onChange={(e) => setRubric((r) => r.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} className="w-16 rounded-md border border-line bg-paper px-2 py-1 text-right disabled:border-transparent disabled:bg-transparent" />%
              </label>
              {owner && rubric.length > 1 && (
                <button onClick={() => setRubric((r) => r.filter((_, j) => j !== i))} className="text-xs text-muted hover:text-ink">Remove</button>
              )}
            </li>
          ))}
        </ul>
        {owner && (
          <button
            onClick={() => setRubric((r) => [...r, { id: `custom${Date.now().toString(36)}`, name: "New criterion", description: "5 = … 0 = …", weight: 10 }])}
            className="mt-3 text-sm text-accent hover:underline"
          >
            + Add a criterion
          </button>
        )}
      </section>

      {owner && (
        <section className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-muted">Accounts researched each night</span>
            <input type="number" min={0} max={10} value={nightly} onChange={(e) => setNightly(Number(e.target.value))} className="mt-1 w-24 rounded-lg border border-line bg-card px-3 py-2" />
          </label>
          <p className="max-w-md text-xs text-muted">Roughly $0.15–0.30 of AI usage per account. 3 a night ≈ $15–25 a month. Set 0 to pause.</p>
          <span className="flex-1" />
          <Button variant="primary" onClick={save} disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save ICP & rubric"}</Button>
        </section>
      )}
      {err && <p className="text-sm text-warn">{err}</p>}
    </div>
  );
}

function Field({ label, value, onChange, ro, multiline }: { label: string; value: string; onChange: (v: string) => void; ro: boolean; multiline?: boolean }) {
  const cls = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink disabled:bg-paper";
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      {multiline ? (
        <textarea disabled={ro} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input disabled={ro} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}
