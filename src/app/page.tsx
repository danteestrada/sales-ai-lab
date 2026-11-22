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
    title: "Saves time or it doesn't ship",
    body: "If a tool doesn't save a rep time or help them make a better call, I don't build it.",
  },
  {
    title: "Sources on everything",
    body: "Every claim shows where it came from and when. If the AI is guessing, it says so.",
  },
  {
    title: "I measure it",
    body: "I check the results against reality and post the numbers here, misses included.",
  },
  {
    title: "Works for any company",
    body: "Nothing is built for one employer. Set your ICP once and point it at whatever you sell.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 md:pt-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{person.name} · {person.location}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          I&apos;m a B2B seller who builds his own AI tools.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          I&apos;ve spent the last year and a half on the phones with CFOs and FP&amp;A leaders at HighRadius and Planful. Most of my
          day went to hunting for someone worth calling. I&apos;d rather spend it on the calls.
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          So I build tools that handle the hunting and the busywork, and I test them on real accounts before they go up
          here.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tools/prospector" className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90">
            Try the Prospector
          </Link>
          <Link href="#tools" className="rounded-lg border border-line bg-card px-5 py-3 text-sm font-medium hover:border-ink">
            See what I&apos;m building
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
        <h2 className="text-2xl font-semibold tracking-tight">What&apos;s here</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Live tools work right now, no sign-up. The rest are in progress.
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
          <h2 className="text-2xl font-semibold tracking-tight">How I build these</h2>
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
          <h2 className="text-2xl font-semibold tracking-tight">Get in touch</h2>
          <p className="mt-3 max-w-2xl text-paper/70">
            I&apos;m looking for an Account Executive role selling cloud, data or AI software. If you want to see any of
            this live, I&apos;ll walk you through it.
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
