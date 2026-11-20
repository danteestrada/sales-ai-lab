import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Reads a company's public website: the homepage plus a few pages that usually
// describe what they sell and who buys it. Returns plain text for Claude to read.

const PAGE_HINTS = /(about|customer|case-stud|product|platform|solution|pricing|industr|why-|use-case)/i;
const MAX_EXTRA_PAGES = 3;
const MAX_CHARS_PER_PAGE = 12000;
const TIMEOUT_MS = 8000;

export type SitePage = { url: string; text: string };

export class FetchError extends Error {}

export function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchError("That doesn't look like a website address.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new FetchError("Only http and https websites are supported.");
  }
  return url;
}

// Blocks addresses that point inside private networks (a standard safety check
// for any server that fetches a URL a visitor typed in).
async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new FetchError("That address isn't a public website.");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => {
    throw new FetchError("Couldn't find that website. Check the spelling.");
  });
  for (const { address } of addresses) {
    if (isPrivate(address)) throw new FetchError("That address isn't a public website.");
  }
}

function isPrivate(ip: string): boolean {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    return v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:127.") || v6.startsWith("::ffff:10.") || v6.startsWith("::ffff:192.168.");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function getHtml(url: URL): Promise<{ html: string; finalUrl: URL }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Follow redirects by hand so every hop gets the public-address check.
    let current = url;
    for (let hop = 0; hop < 5; hop++) {
      await assertPublicHost(current.hostname);
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SalesAILab/1.0; +https://github.com/danteestrada/sales-ai-lab)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current);
        if (!["http:", "https:"].includes(current.protocol)) throw new FetchError("That site redirected somewhere unsupported.");
        continue;
      }
      if (!res.ok) throw new FetchError(`The site responded with an error (${res.status}).`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("html")) throw new FetchError("That page isn't a normal web page.");
      return { html: await res.text(), finalUrl: current };
    }
    throw new FetchError("That site redirected too many times.");
  } catch (e) {
    if (e instanceof FetchError) throw e;
    throw new FetchError("Couldn't load that website. It may block automated visitors or be down.");
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_CHARS_PER_PAGE);
}

function pickLinks(html: string, base: URL): URL[] {
  const seen = new Set<string>();
  const picks: URL[] = [];
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    let link: URL;
    try {
      link = new URL(m[1], base);
    } catch {
      continue;
    }
    const sameSite = link.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "");
    if (!sameSite || !PAGE_HINTS.test(link.pathname)) continue;
    if (/\.(pdf|png|jpg|jpeg|gif|svg|zip|mp4)$/i.test(link.pathname)) continue;
    const key = link.origin + link.pathname.replace(/\/$/, "");
    if (seen.has(key) || key === base.origin + base.pathname.replace(/\/$/, "")) continue;
    seen.add(key);
    picks.push(link);
    if (picks.length >= MAX_EXTRA_PAGES) break;
  }
  return picks;
}

export async function readCompanySite(input: string): Promise<SitePage[]> {
  const start = normalizeUrl(input);
  const home = await getHtml(start);
  const pages: SitePage[] = [{ url: home.finalUrl.toString(), text: htmlToText(home.html) }];
  const extras = pickLinks(home.html, home.finalUrl);
  const results = await Promise.allSettled(extras.map((u) => getHtml(u)));
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const text = htmlToText(r.value.html);
      if (text.length > 200) pages.push({ url: extras[i].toString(), text });
    }
  });
  if (pages.reduce((n, p) => n + p.text.length, 0) < 300) {
    throw new FetchError("That site didn't have enough readable text. Many sites load content with JavaScript; try its About or Product page directly.");
  }
  return pages;
}
