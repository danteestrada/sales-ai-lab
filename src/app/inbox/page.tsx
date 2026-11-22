import type { Metadata } from "next";
import Inbox from "./Inbox";

export const metadata: Metadata = { title: "Inbox | Sales AI Lab", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <p className="label-caps text-muted">Private</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-2 text-muted">Messages from the Get in touch form, screened and sorted.</p>
      <Inbox />
    </div>
  );
}
