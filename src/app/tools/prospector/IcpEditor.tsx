"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  // List boxes keep their raw text while you type (so Enter works); they become lists on save.
  type ListKey = "industries" | "regions" | "personas" | "disqualifiers";
  const [lists, setLists] = useState<Record<ListKey, string>>({
    industries: listToText(settings.icp.industries),
    regions: listToText(settings.icp.regions),
    personas: listToText(settings.icp.personas),
    disqualifiers: listToText(settings.icp.disqualifiers),
  });
  const setList = (k: ListKey, v: string) => setLists((l) => ({ ...l, [k]: v }));
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
      setLists((l) => ({
        industries: d.industries?.length ? listToText(d.industries) : l.industries,
        regions: d.regions?.length ? listToText(d.regions) : l.regions,
        personas: d.personas?.length ? listToText(d.personas) : l.personas,
        disqualifiers: d.disqualifiers?.length ? listToText(d.disqualifiers) : l.disqualifiers,
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
      const { settings: s } = await api<{ settings: Settings }>("settings", {
        body: {
          icp: {
            ...icp,
            industries: textToList(lists.industries),
            regions: textToList(lists.regions),
            personas: textToList(lists.personas),
            disqualifiers: textToList(lists.disqualifiers),
          },
          rubric,
          nightlyAccounts: nightly,
        },
      });
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

      <Group title="What you sell" note="Who you're prospecting for, in plain words.">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <Field label="Company" value={icp.sellerCompany} onChange={(v) => set("sellerCompany", v)} ro={ro} />
          <Field label="What you sell" value={icp.whatYouSell} onChange={(v) => set("whatYouSell", v)} ro={ro} multiline />
        </div>
      </Group>

      <Group title="Who you're targeting" note="One per line.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Industries" value={lists.industries} onChange={(v) => setList("industries", v)} ro={ro} multiline />
          <Field label="Buyer personas (job titles)" value={lists.personas} onChange={(v) => setList("personas", v)} ro={ro} multiline />
          <Field label="Regions (e.g. Texas, United States, UK)" value={lists.regions} onChange={(v) => setList("regions", v)} ro={ro} multiline />
          <div className="grid grid-cols-2 gap-3 self-start">
            <Field label="Min employees" value={String(icp.sizeMin)} onChange={(v) => set("sizeMin", Number(v.replace(/\D/g, "")) || 0)} ro={ro} />
            <Field label="Max employees" value={String(icp.sizeMax)} onChange={(v) => set("sizeMax", Number(v.replace(/\D/g, "")) || 0)} ro={ro} />
          </div>
        </div>
      </Group>

      <Group title="Rules for the AI" note="What to skip, and anything a new rep on your team would need to know.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Disqualifiers (one per line)" value={lists.disqualifiers} onChange={(v) => setList("disqualifiers", v)} ro={ro} multiline />
          <Field label="Notes: buying triggers, what to avoid, context" value={icp.notes} onChange={(v) => set("notes", v)} ro={ro} multiline />
        </div>
      </Group>

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
              {ro ? (
                <p className="text-sm leading-relaxed text-muted">{c.description}</p>
              ) : (
                <AutoTextarea value={c.description} onChange={(v) => setRubric((r) => r.map((x, j) => (j === i ? { ...x, description: v } : x)))} className="rounded-md border border-line bg-paper px-2 py-1 text-sm leading-relaxed outline-none focus:border-white/40" />
              )}
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

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h3 className="font-semibold">{title}</h3>
      {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, ro, multiline }: { label: string; value: string; onChange: (v: string) => void; ro: boolean; multiline?: boolean }) {
  if (ro) {
    return (
      <div className="text-sm">
        <span className="text-muted">{label}</span>
        <p className="mt-1 whitespace-pre-line leading-relaxed">{value || "Not set"}</p>
      </div>
    );
  }
  const cls = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm leading-relaxed outline-none focus:border-white/40";
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      {multiline ? <AutoTextarea value={value} onChange={onChange} className={cls} /> : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </label>
  );
}

// A text box that grows to fit everything in it, so nothing hides behind a scrollbar.
function AutoTextarea({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`${className} resize-none overflow-hidden`} />;
}
