import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { CredentialIcon } from "@/components/icons";
import { credentials, person, tools, type ToolStatus } from "@/lib/site";

const statusLabel: Record<ToolStatus, string> = { live: "Live", building: "In build", planned: "Planned" };
const statusStyle: Record<ToolStatus, string> = {
  live: "border-good/40 text-good",
  building: "border-accent/40 text-accent",
  planned: "border-line text-muted",
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
      {/* Hero: the banner's mountain sits on the right, faded into the night sky */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[62%] md:block">
          <Image src="/peak.jpg" alt="" fill priority sizes="62vw" className="object-cover object-right-bottom opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper/80 via-transparent to-paper/40" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex items-center gap-4">
            <Image src="/headshot.png" alt={person.name} width={88} height={88} priority className="rounded-full ring-1 ring-white/15" />
            <div>
              <p className="text-lg font-semibold">{person.name}</p>
              <p className="label-caps mt-1 text-muted">B2B seller · {person.location}</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            AI tools that do the research, so sellers can sell.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Prospecting, pipeline reviews, business cases and call prep, built by a B2B seller and tested on real
            accounts. Every answer shows its sources, and the accuracy numbers get published, misses included.
          </p>
          <p className="label-caps mt-6 max-w-xl leading-loose text-muted">
            B2B sales to CFOs and FP&amp;A leaders at HighRadius and Planful · Baylor finance · AWS and Databricks certified
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/tools/prospector" className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90">
              Try the Prospector
            </Link>
            <Link href="#tools" className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium hover:border-white/50">
              See the tools
            </Link>
          </div>
        </div>
      </section>

      {/* Credentials in the banner's icon-row style */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-5xl grid-cols-2 px-6 py-10 md:grid-cols-4">
          {credentials.map((c, i) => (
            <div key={c.title} className={`flex flex-col items-center px-4 py-4 text-center ${i > 0 ? "md:border-l md:border-line" : ""} ${i % 2 === 1 ? "border-l border-line md:border-l" : ""}`}>
              <CredentialIcon kind={c.icon} />
              <p className="label-caps mt-4 leading-relaxed text-ink">{c.title}</p>
              <p className="mt-2 text-xs text-muted">{c.org}</p>
              <p className="mt-2 max-w-[16rem] text-sm text-muted">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-20">
        <p className="label-caps text-muted">The lab</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">What&apos;s here</h2>
        <p className="mt-2 max-w-2xl text-muted">Live tools work right now, no sign-up. The rest are in progress.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {tools.map((t) => {
            const card = (
              <div className={`flex h-full flex-col rounded-xl border border-line bg-card p-6 transition ${t.status === "live" ? "hover:border-white/30" : "opacity-80"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <span className={`label-caps shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${statusStyle[t.status]}`}>
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
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-caps text-muted">Ground rules</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">How I build these</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="bg-paper p-6">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative scroll-mt-20 overflow-hidden border-t border-line">
        <div aria-hidden className="absolute inset-0">
          <Image src="/peak.jpg" alt="" fill sizes="100vw" className="object-cover object-right-bottom opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/85 to-paper/20" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <div className="flex items-center gap-4">
            <Image src="/headshot.png" alt={person.name} width={56} height={56} className="rounded-full ring-1 ring-white/15" />
            <p className="label-caps text-muted">Focused on what&apos;s next</p>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Get in touch</h2>
          <p className="mt-3 max-w-xl text-muted">
            Looking for an Account Executive role selling cloud, data or AI software. Hiring? Send a note, or connect on{" "}
            <a href={person.linkedin} className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-white">LinkedIn</a>.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
