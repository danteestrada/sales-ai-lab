import Link from "next/link";
import { credentials, person, tools, type ToolStatus } from "@/lib/site";

const statusLabel: Record<ToolStatus, string> = { live: "Live", building: "In build", planned: "Planned" };
const statusStyle: Record<ToolStatus, string> = {
  live: "bg-good-soft text-good",
  building: "bg-accent-soft text-accent",
  planned: "bg-paper text-muted border border-line",
};

const principles = [
  {
    title: "Faster, smarter, or it doesn't ship",
    body: "Every tool has to give a seller back time or sharpen a decision. Anything else is a demo, not a tool.",
  },
  {
    title: "Show the work",
    body: "Claims are marked as sourced or inferred, with links. Buyers fact-check AI; sellers should too.",
  },
  {
    title: "Measured, not vibes",
    body: "Each tool gets tested against real cases, and the results get published — including where it falls short.",
  },
  {
    title: "Works for any company",
    body: "Point it at AWS, Microsoft or a 40-person startup. Product Brain profiles the company once; every tool reuses it.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 md:pt-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{person.name} · {person.location}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          I sell B2B software. I also build the AI tools that make selling it faster and sharper.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Finance-trained at Baylor, AWS and Databricks certified, and fresh off the phones calling CFOs and finance leaders.
          This lab is where I turn the worst parts of the sales job into software — prospecting, pipeline reviews,
          business cases, call prep — and test whether it actually works.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tools/product-brain" className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90">
            Try Product Brain
          </Link>
          <Link href="#tools" className="rounded-lg border border-line bg-card px-5 py-3 text-sm font-medium hover:border-ink">
            See all tools
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-5xl gap-px px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {credentials.map((c) => (
            <div key={c.title} className="py-3 sm:pr-6">
              <p className="text-sm font-semibold">{c.title}</p>
              <p className="text-xs text-muted">{c.org}</p>
              <p className="mt-2 text-sm text-muted">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">The tools</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Six tools, built in public. Live ones work right now with no sign-up.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {tools.map((t) => {
            const card = (
              <div className={`flex h-full flex-col rounded-xl border border-line bg-card p-6 transition ${t.status === "live" ? "hover:border-ink" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[t.status]}`}>
                    {statusLabel[t.status]}
                    {t.status !== "live" && t.eta ? ` · ${t.eta}` : ""}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed">{t.oneLiner}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.impact}</p>
                {t.status === "live" && <p className="mt-auto pt-5 text-sm font-medium text-accent">Open the tool →</p>}
              </div>
            );
            return t.status === "live" ? (
              <Link key={t.slug} href={`/tools/${t.slug}`}>{card}</Link>
            ) : (
              <div key={t.slug}>{card}</div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How I build</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title}>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-8 border-t border-line bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Let&apos;s talk</h2>
          <p className="mt-3 max-w-2xl text-paper/70">
            I&apos;m looking for an Account Executive role selling cloud, data or AI software. If you&apos;d like a live
            walkthrough of anything here, I&apos;m happy to give one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${person.email}`} className="rounded-lg bg-paper px-5 py-3 text-sm font-medium text-ink hover:opacity-90">
              {person.email}
            </a>
            <a href={person.linkedin} className="rounded-lg border border-paper/30 px-5 py-3 text-sm font-medium hover:border-paper">
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
