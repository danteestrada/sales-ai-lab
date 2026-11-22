import type { Metadata } from "next";
import ProspectorApp from "./ProspectorApp";

export const metadata: Metadata = {
  title: "ICP Prospector | Sales AI Lab",
  description: "Finds accounts that fit now, explains why with dated sources, verifies contacts, and learns from feedback.",
};

const steps = [
  { title: "You define the ICP", body: "Industries, regions, size, personas, disqualifiers, plus a weighted scoring rubric. It can draft all of it from your company's website." },
  { title: "It hunts and researches", body: "Live web search for accounts that fit, then a research pass per account: dated evidence with links, a 0–5 score per criterion, why now, why not, and an opener." },
  { title: "Math, not vibes", body: "The final score is calculated in code from your weights. Contact confidence comes from how recent the source is. The AI never grades itself." },
  { title: "It learns and keeps working", body: "Your 👍/👎 shifts the weights (and you can see exactly how). Your notes feed future searches. It runs nightly in the background." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Tool · Live</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">ICP Prospector</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        The worst part of an SDR&apos;s day is hours on LinkedIn looking for one good account. This finds accounts that fit
        <em> now</em>, explains why with dated sources, names the buyers only when a source does, and ranks them so the
        best are on top.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-line bg-card p-4">
            <p className="font-mono text-xs text-muted">0{i + 1}</p>
            <p className="mt-1 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
      <ProspectorApp />
    </div>
  );
}
