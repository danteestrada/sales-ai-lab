import type { Metadata } from "next";
import ProductBrain from "./ProductBrain";

export const metadata: Metadata = {
  title: "Product Brain — Sales AI Lab",
  description: "Turn any company's website into an ICP, personas, value props and competitors — with sources.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Tool 1 · Live</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Product Brain</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Paste any company&apos;s website. It reads their own pages and builds the go-to-market profile a seller needs:
        who buys, why, who they compete with, and proof. Every claim is labeled <Tag basis="site" /> or{" "}
        <Tag basis="inferred" /> so you know what to verify before you lean on it.
      </p>
      <ProductBrain />
      <section className="mt-16 grid gap-8 border-t border-line pt-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold">Why it exists</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Every new role, territory or product launch starts with the same scramble: who do we sell to and why? This
            does the first pass in under a minute, and every other tool in the lab reuses it.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">How it works</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The server reads the homepage plus up to three pages about products, customers or pricing. Claude turns
            that text into a fixed structure, and is told to separate what the site says from what it&apos;s inferring.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Known limits</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            It only reads public pages, so it sees the company&apos;s own pitch. Some sites block automated readers or
            load text with JavaScript. Competitors are usually inferred. You can edit anything before you use it.
          </p>
        </div>
      </section>
    </div>
  );
}

function Tag({ basis }: { basis: "site" | "inferred" }) {
  return basis === "site" ? (
    <span className="rounded bg-good-soft px-1.5 py-0.5 text-sm font-medium text-good">from site</span>
  ) : (
    <span className="rounded bg-warn-soft px-1.5 py-0.5 text-sm font-medium text-warn">inferred</span>
  );
}
