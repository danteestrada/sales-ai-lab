import type { Metadata } from "next";
import { credentials, person } from "@/lib/site";

export const metadata: Metadata = { title: "About | Sales AI Lab" };

export default function About() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">About</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{person.name}</h1>

      <div className="mt-8 space-y-5 text-lg leading-relaxed">
        <p>
          I studied finance and entrepreneurship at Baylor. Finance is why I&apos;m comfortable talking payback and
          ROI with a CFO. Entrepreneurship is why I like building things from nothing.
        </p>
        <p>
          I started in commission car sales, then worked at JPMorgan Chase and Impact Networking before moving into
          SaaS. At HighRadius and Planful I sold to finance leaders, mostly CFOs and FP&amp;A teams.
        </p>
        <p>
          I&apos;m at my best in front of a buyer. The hours of research, list building and pipeline guesswork around
          that are what I automate. I hold the tools to the same
          standard I&apos;d hold a new analyst: show your sources, say when you&apos;re guessing, and let me check your
          work.
        </p>
        <p>
          I got my AWS and Databricks certifications so I could follow the technical side of a deal. I&apos;m not an
          engineer, but I can ask the right questions and I won&apos;t promise a customer something the product
          can&apos;t do.
        </p>
      </div>

      <h2 className="mt-14 text-xl font-semibold">Credentials</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {credentials.map((c) => (
          <li key={c.title} className="py-4">
            <p className="font-medium">{c.title} <span className="font-normal text-muted">· {c.org}</span></p>
            <p className="text-sm text-muted">{c.note}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
