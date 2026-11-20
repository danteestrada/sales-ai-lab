import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { person } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales AI Lab — Dante Estrada",
  description: "AI tools that make B2B SaaS sellers faster and sharper. Built by Dante Estrada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Sales AI Lab <span className="font-normal text-muted">· {person.name}</span>
            </Link>
            <div className="flex gap-5 text-sm text-muted">
              <Link href="/#tools" className="hover:text-ink">Tools</Link>
              <Link href="/about" className="hover:text-ink">About</Link>
              <Link href="/#contact" className="hover:text-ink">Contact</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
            <span>Built by {person.name} with Claude · {person.location}</span>
            <div className="flex gap-5">
              <a href={person.linkedin} className="hover:text-ink">LinkedIn</a>
              <a href={person.github} className="hover:text-ink">Source code</a>
              <Link href="/status" className="hover:text-ink">AI status</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
