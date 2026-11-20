"use client";

import { useEffect, useState } from "react";
import type { Basis, Profile } from "@/lib/product-brain";

const EXAMPLES = [
  { label: "AWS", url: "aws.amazon.com" },
  { label: "iDeals", url: "idealsvdr.com" },
  { label: "Datadog", url: "datadoghq.com" },
];

const STEPS = ["Reading their website", "Finding product and customer pages", "Building the profile", "Separating facts from inferences"];

export const ACTIVE_PROFILE_KEY = "salesLab.activeProfile";

export default function ProductBrain() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [loading]);

  async function run(target: string) {
    if (!target.trim()) return;
    setUrl(target);
    setStep(0);
    setLoading(true);
    setError(null);
    setProfile(null);
    setEditing(false);
    setSaved(false);
    try {
      const res = await fetch("/api/product-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setProfile(data.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function patch(fn: (p: Profile) => void) {
    setProfile((p) => {
      if (!p) return p;
      const next = structuredClone(p);
      fn(next);
      return next;
    });
    setSaved(false);
  }

  function saveForTools() {
    if (!profile) return;
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
      setSaved(true);
    } catch {
      setError("Your browser blocked saving. Use Download instead.");
    }
  }

  function download() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-profile.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(url);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Company website, e.g. snowflake.com"
          className="flex-1 rounded-lg border border-line bg-card px-4 py-3 outline-none focus:border-ink"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-lg bg-ink px-6 py-3 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Working…" : "Build profile"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        Try one:
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => run(ex.url)}
            disabled={loading}
            className="rounded-full border border-line bg-card px-3 py-1 hover:border-ink disabled:opacity-40"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-8 rounded-xl border border-line bg-card p-6">
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i <= step ? "text-ink" : "text-muted/50"}`}>
                <span className={`h-2 w-2 rounded-full ${i < step ? "bg-good" : i === step ? "animate-pulse bg-accent" : "bg-line"}`} />
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">Usually 20–45 seconds.</p>
        </div>
      )}

      {error && <div className="mt-8 rounded-xl border border-warn/30 bg-warn-soft p-5 text-sm">{error}</div>}

      {profile && (
        <div className="mt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              {editing ? (
                <Field value={profile.company} onChange={(v) => patch((p) => void (p.company = v))} className="text-2xl font-semibold" />
              ) : (
                <h2 className="text-2xl font-semibold">{profile.company}</h2>
              )}
              {editing ? (
                <Field value={profile.oneLiner} onChange={(v) => patch((p) => void (p.oneLiner = v))} multiline />
              ) : (
                <p className="mt-2 text-lg leading-relaxed">{profile.oneLiner}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setEditing((e) => !e)} className="rounded-lg border border-line bg-card px-4 py-2 text-sm hover:border-ink">
                {editing ? "Done editing" : "Edit"}
              </button>
              <button onClick={download} className="rounded-lg border border-line bg-card px-4 py-2 text-sm hover:border-ink">
                Download
              </button>
              <button onClick={saveForTools} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {saved ? "Saved ✓" : "Use in other tools"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card title="What they sell">
              <TaggedList items={profile.whatTheySell} editing={editing} onChange={(items) => patch((p) => void (p.whatTheySell = items))} />
            </Card>
            <Card title="Ideal customer">
              <Label>Industries</Label>
              <TaggedList items={profile.icp.industries} editing={editing} onChange={(items) => patch((p) => void (p.icp.industries = items))} />
              <Label>Company size</Label>
              <TaggedList items={[profile.icp.companySize]} editing={editing} onChange={(items) => patch((p) => void (p.icp.companySize = items[0] ?? p.icp.companySize))} />
              <Label>Regions</Label>
              <TaggedList items={profile.icp.regions} editing={editing} onChange={(items) => patch((p) => void (p.icp.regions = items))} />
            </Card>
            <Card title="Buying triggers" note="Events that make a company likely to buy now">
              <TaggedList items={profile.icp.buyingTriggers} editing={editing} onChange={(items) => patch((p) => void (p.icp.buyingTriggers = items))} />
            </Card>
            <Card title="Competitors">
              <TaggedList
                items={profile.competitors.map((c) => ({ item: c.name, basis: c.basis }))}
                editing={editing}
                onChange={(items) => patch((p) => void (p.competitors = items.map((i) => ({ name: i.item, basis: i.basis }))))}
              />
            </Card>
          </div>

          <Card title="Buyer personas" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2">
              {profile.personas.map((ps, i) => (
                <div key={i} className="rounded-lg border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    {editing ? (
                      <Field value={ps.title} onChange={(v) => patch((p) => void (p.personas[i].title = v))} className="font-semibold" />
                    ) : (
                      <p className="font-semibold">{ps.title}</p>
                    )}
                    <BasisTag basis={ps.basis} />
                  </div>
                  {editing ? (
                    <Field value={ps.caresAbout} onChange={(v) => patch((p) => void (p.personas[i].caresAbout = v))} multiline />
                  ) : (
                    <p className="mt-1 text-sm leading-relaxed text-muted">{ps.caresAbout}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Value props" className="mt-5">
            <ul className="divide-y divide-line">
              {profile.valueProps.map((v, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    {editing ? (
                      <Field value={v.claim} onChange={(x) => patch((p) => void (p.valueProps[i].claim = x))} className="font-medium" />
                    ) : (
                      <p className="font-medium">{v.claim}</p>
                    )}
                    <BasisTag basis={v.basis} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{v.evidence}</p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card title="Proof points" note="Named customers and results found on their pages">
              {profile.proofPoints.length === 0 ? (
                <p className="text-sm text-muted">None found on the pages read. Check their case studies page directly.</p>
              ) : (
                <ul className="space-y-3">
                  {profile.proofPoints.map((pp, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{pp.customer}:</span> {pp.result}{" "}
                      {pp.sourceUrl.startsWith("http") && (
                        <a href={pp.sourceUrl} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                          source
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Open questions" note="What a seller still needs to confirm">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {profile.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </Card>
          </div>

          <p className="mt-6 text-xs text-muted">
            Pages read:{" "}
            {profile.sourcesRead.map((s, i) => (
              <span key={s}>
                {i > 0 && " · "}
                <a href={s} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                  {s.replace(/^https?:\/\//, "")}
                </a>
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

function Card({ title, note, children, className = "" }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-card p-5 ${className}`}>
      <h3 className="font-semibold">{title}</h3>
      {note && <p className="text-xs text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 mb-1 font-mono text-[11px] uppercase tracking-wider text-muted first:mt-0">{children}</p>;
}

function BasisTag({ basis }: { basis: Basis }) {
  return basis === "site" ? (
    <span className="shrink-0 rounded bg-good-soft px-1.5 py-0.5 text-[11px] font-medium text-good">from site</span>
  ) : (
    <span className="shrink-0 rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">inferred</span>
  );
}

function TaggedList({
  items,
  editing,
  onChange,
}: {
  items: { item: string; basis: Basis }[];
  editing: boolean;
  onChange: (items: { item: string; basis: Basis }[]) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start justify-between gap-3 text-sm">
          {editing ? (
            <>
              <Field value={it.item} onChange={(v) => onChange(items.map((x, j) => (j === i ? { item: v, basis: x.basis } : x)))} />
              {items.length > 1 && (
                <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-muted hover:text-ink" aria-label="Remove">
                  ✕
                </button>
              )}
            </>
          ) : (
            <>
              <span>{it.item}</span>
              <BasisTag basis={it.basis} />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function Field({
  value,
  onChange,
  multiline,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const base = `w-full rounded-md border border-line bg-paper px-2 py-1 outline-none focus:border-ink ${className}`;
  return multiline ? (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`mt-1 text-sm ${base}`} />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} className={base} />
  );
}
