import type { Metadata } from "next";
import { credentials, person } from "@/lib/site";

export const metadata: Metadata = { title: "About — Sales AI Lab" };

export default function About() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">About</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{person.name}</h1>

      <div className="mt-8 space-y-5 text-lg leading-relaxed">
        <p>
          I studied finance at Baylor so I can talk ROI, payback and risk with the people who sign. I studied
          entrepreneurship because I&apos;m comfortable building from zero. I earned my AWS and Databricks credentials to
          understand how cloud, data and AI actually work — enough to ask better questions and never overpromise
          what the technology can do.
        </p>
        <p>
          My sales career has run through commission car sales, JPMorgan Chase, Impact Networking, and SaaS
          business development at HighRadius and Planful, where I spent my days on the phones with CFOs and finance
          leaders.
        </p>
        <p>
          The part of that job I loved was the conversation. The part I didn&apos;t was everything around it: hours to
          find one good prospect, pipeline reviews built on gut feel, business cases rebuilt from scratch. So I started
          building tools that take those parts over — and holding them to the same standard I&apos;d hold a junior
          analyst: show your sources, flag what you&apos;re guessing, and get measured.
        </p>
        <p className="text-muted">
          I want to be the rep who can translate between business, finance and technical teams on cloud and AI deals.
          This lab is the proof.
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
