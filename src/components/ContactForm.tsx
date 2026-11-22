"use client";

import { useEffect, useRef, useState } from "react";

const field = "w-full rounded-md border border-white/15 bg-paper/70 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-white/50";

export default function ContactForm() {
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now(); // when the visitor first saw the form
  }, []);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, startedAt: startedAt.current }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDone(json.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="mt-7 max-w-xl rounded-md border border-good/30 bg-good-soft px-4 py-3 text-sm text-good">{done}</p>;
  }

  return (
    <form onSubmit={submit} className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
      <input name="name" required placeholder="Your name" className={field} autoComplete="name" />
      <input name="email" type="email" required placeholder="Work email" className={field} autoComplete="email" />
      <input name="company" required placeholder="Company" className={field} autoComplete="organization" />
      <input name="title" required placeholder="Your title" className={field} autoComplete="organization-title" />
      <input name="hiringFor" placeholder="Role you're hiring for (optional)" className={field} />
      <input name="linkedin" placeholder="Your LinkedIn URL (optional)" className={field} />
      <textarea name="message" required minLength={20} rows={4} placeholder="What's the role, and why reach out?" className={`${field} sm:col-span-2`} />
      {/* Hidden from people; bots fill it in and get filtered out. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50">
          {busy ? "Sending…" : "Send"}
        </button>
        <p className="text-xs text-muted">Every message is screened before it gets read.</p>
      </div>
      {err && <p className="text-sm text-warn sm:col-span-2">{err}</p>}
    </form>
  );
}
