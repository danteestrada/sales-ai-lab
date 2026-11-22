import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODELS } from "../anthropic";
import { readCompanySite } from "../fetch-site";
import { finalConfidence } from "./scoring";
import type { Account, Contact, ContactCheck, Icp, Research, Settings } from "./types";

// ---------- shared agent loop ----------
// Claude searches the web as many times as allowed, then must hand back its answer by
// calling a "save_..." tool with a fixed shape. Handles paused turns and nudges once
// if it answers in plain text.

type RunResult<T> = { input: T; searches: number };

async function runAgent<T>(opts: {
  system: string;
  prompt: string;
  finalTool: Anthropic.Tool;
  maxSearches: number;
  maxTokens?: number;
  model?: "smart" | "fast";
}): Promise<RunResult<T>> {
  const fast = opts.model === "fast";
  const tools: Anthropic.Messages.ToolUnion[] = [opts.finalTool];
  if (opts.maxSearches > 0) {
    tools.unshift({ type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches });
  }
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.prompt }];
  let searches = 0;
  let nudges = 0;

  for (let turn = 0; turn < 8; turn++) {
    const msg = await getClient().messages.create({
      model: fast ? MODELS.fast : MODELS.smart,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      tools,
      tool_choice: { type: "auto" },
      ...(fast ? {} : { thinking: { type: "between_tools" as const } }),
      messages,
    });
    searches += msg.content.filter((b) => b.type === "server_tool_use").length;
    const final = msg.content.find((b) => b.type === "tool_use" && b.name === opts.finalTool.name);
    if (final && final.type === "tool_use") return { input: final.input as T, searches };

    messages.push({ role: "assistant", content: msg.content as Anthropic.ContentBlockParam[] });
    if (msg.stop_reason === "pause_turn") continue; // long search turn: let it keep going
    if (nudges >= 2) break;
    nudges++;
    messages.push({
      role: "user",
      content: `Stop searching and call ${opts.finalTool.name} now with what you have. Use empty lists or "unknown" for anything you couldn't confirm.`,
    });
  }
  throw new Error(`The AI didn't return a result (${opts.finalTool.name}).`);
}

// ---------- context the AI gets every time ----------

export function icpBrief(s: Settings, feedbackNotes: string[] = []): string {
  const i = s.icp;
  const lines = [
    `Seller: ${i.sellerCompany || "unspecified"} — ${i.whatYouSell || "unspecified"}`,
    `Target industries: ${i.industries.join("; ") || "any"}`,
    `Target regions: ${i.regions.join("; ") || "any"}`,
    `Company size: ${i.sizeMin.toLocaleString()}–${i.sizeMax.toLocaleString()} employees`,
    `Buyer personas: ${i.personas.join("; ") || "unspecified"}`,
    `Disqualifiers: ${i.disqualifiers.join("; ") || "none"}`,
  ];
  if (i.notes) lines.push(`Seller's notes: ${i.notes}`);
  lines.push(
    "Scoring rubric (score each 0-5):",
    ...s.rubric.map((c) => `- ${c.id} "${c.name}" (weight ${c.weight}%): ${c.description}`),
  );
  if (feedbackNotes.length) {
    lines.push("The seller's past feedback on accounts (learn from it):", ...feedbackNotes.map((n) => `- ${n}`));
  }
  return lines.join("\n");
}

export function feedbackNotes(accounts: Account[]): string[] {
  return accounts
    .filter((a) => a.feedback)
    .sort((a, b) => (b.feedback!.at > a.feedback!.at ? 1 : -1))
    .slice(0, 15)
    .map((a) => {
      const f = a.feedback!;
      return `${a.name} (${a.industry}, ${a.employees} employees, ${a.region}): ${f.verdict === "up" ? "GOOD" : "BAD"} — ${[...f.reasons, f.note].filter(Boolean).join("; ")}`;
    });
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------- 1. discover accounts ----------

export type Candidate = Omit<Account, "id" | "status" | "discoveredAt"> & { sourceUrl: string };

const candidatesTool: Anthropic.Tool = {
  name: "save_candidates",
  description: "Save the list of candidate accounts.",
  input_schema: {
    type: "object",
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            domain: { type: "string", description: "Primary website domain, e.g. acme.com" },
            hq: { type: "string", description: "HQ city, state/country" },
            region: { type: "string" },
            industry: { type: "string" },
            employees: { type: "string", description: "Employee estimate, e.g. '1,200' or '1,000-5,000'" },
            discoveryReason: { type: "string", description: "One sentence: why this company might fit right now." },
            sourceUrl: { type: "string", description: "A page supporting the reason." },
          },
          required: ["name", "domain", "hq", "region", "industry", "employees", "discoveryReason", "sourceUrl"],
        },
      },
    },
    required: ["candidates"],
  },
};

export async function discoverAccounts(s: Settings, existing: Account[], count: number) {
  const exclude = existing.map((a) => a.domain || a.name).slice(0, 200);
  const system = `You are a top-performing B2B sales development researcher. Today is ${today()}.
Find real companies that match the seller's ICP and show a reason to buy now. Use web search.
Rules:
- Only real, currently operating companies. Verify each exists with a search result.
- Respect the region, industry and size filters strictly.
- Prefer companies with fresh (last 12 months) public evidence of a change or priority relevant to what the seller sells. Reasoning beats keyword signals.
- Never include companies on the exclude list, or the seller itself.
- Be efficient with searches: use list-style queries (industry lists, news of funding, exec hires, expansions) that surface several companies at once.
- Finish by calling save_candidates once.`;
  const prompt = `${icpBrief(s, feedbackNotes(existing))}

Find ${count} new candidate accounts.
Exclude these (already in the list): ${exclude.join(", ") || "none"}`;
  const { input, searches } = await runAgent<{ candidates: Candidate[] }>({
    system,
    prompt,
    finalTool: candidatesTool,
    maxSearches: 8,
  });
  return { candidates: (input.candidates ?? []).slice(0, count), searches };
}

// ---------- 2. research one account ----------

const researchTool: Anthropic.Tool = {
  name: "save_research",
  description: "Save the research and scoring for this account.",
  input_schema: {
    type: "object",
    properties: {
      company: {
        type: "object",
        description: "Corrected basics, from what you found.",
        properties: {
          name: { type: "string" },
          domain: { type: "string" },
          hq: { type: "string" },
          region: { type: "string" },
          industry: { type: "string" },
          employees: { type: "string" },
        },
        required: ["name", "domain", "hq", "region", "industry", "employees"],
      },
      whyNow: { type: "string", description: "2-4 short bullet points a seller could act on: why this account, why now. One line each, each starting with '- '. Specific, dated, no hype." },
      whyNot: { type: "string", description: "1-3 short bullet points: the honest case against pursuing it now. One line each, each starting with '- '." },
      disqualified: { type: "boolean" },
      disqualifiedReason: { type: "string" },
      criteria: {
        type: "array",
        description: "One entry per rubric criterion, using its id.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            score: { type: "number", description: "0-5" },
            reasoning: { type: "string", description: "1-3 short bullet points, one line each, each starting with '- '." },
            evidence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fact: { type: "string" },
                  url: { type: "string" },
                  date: { type: "string", description: "Publication date as YYYY-MM-DD or YYYY-MM; empty if unknown." },
                },
                required: ["fact", "url", "date"],
              },
            },
          },
          required: ["id", "score", "reasoning", "evidence"],
        },
      },
      contacts: {
        type: "array",
        description: "Only people a source names in a buying-persona role at this company. Never guess.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            sourceUrl: { type: "string" },
            sourceDate: { type: "string", description: "Date of the source naming them in this role, YYYY-MM-DD or YYYY-MM; empty if unknown." },
          },
          required: ["name", "title", "sourceUrl", "sourceDate"],
        },
      },
      personasToTarget: { type: "array", items: { type: "string" } },
      opener: { type: "string", description: "A first line for a cold call or email, tied to the strongest evidence. Under 40 words, no flattery." },
    },
    required: ["company", "whyNow", "whyNot", "disqualified", "disqualifiedReason", "criteria", "contacts", "personasToTarget", "opener"],
  },
};

type ResearchInput = Omit<Research, "researchedAt" | "searchesUsed" | "contacts"> & {
  company: Pick<Account, "name" | "domain" | "hq" | "region" | "industry" | "employees">;
  contacts: { name: string; title: string; sourceUrl: string; sourceDate: string }[];
};

export async function researchAccount(s: Settings, target: Pick<Account, "name" | "domain">, notes: string[]) {
  const system = `You are a senior account researcher for a B2B seller. Today is ${today()}.
Research the target account with web search and score it against the seller's rubric.
Rules:
- Evidence must come from sources you actually found, with the URL and the publication date. Prefer the last 12-18 months; older evidence counts for less.
- Look for: the company's own statements (earnings calls, annual reports, press releases, exec interviews), leadership changes, funding/M&A, hiring patterns, expansions, layoffs, systems they use.
- Contacts: only list a person if a source names them in a role matching the buyer personas at this company. Record the source and its date. If a newer source shows they left, don't list them. Never infer names or emails.
- Be honest: if evidence is thin, score low and say so. Do not inflate.
- Write plainly, like a sharp rep briefing their manager.
- Finish by calling save_research once.`;
  const prompt = `${icpBrief(s, notes)}

Target account: ${target.name}${target.domain ? ` (${target.domain})` : ""}`;
  const { input, searches } = await runAgent<ResearchInput>({
    system,
    prompt,
    finalTool: researchTool,
    maxSearches: 6,
    maxTokens: 10000,
  });
  const research: Research = {
    researchedAt: new Date().toISOString(),
    whyNow: input.whyNow ?? "",
    whyNot: input.whyNot ?? "",
    disqualified: Boolean(input.disqualified),
    disqualifiedReason: input.disqualifiedReason ?? "",
    criteria: (input.criteria ?? []).filter((c) => s.rubric.some((r) => r.id === c.id)),
    contacts: await verifyContacts(
      (input.contacts ?? []).slice(0, 5),
      input.company?.name || target.name,
    ),
    personasToTarget: input.personasToTarget ?? [],
    opener: input.opener ?? "",
    searchesUsed: searches,
  };
  return { research, company: input.company };
}

// ---------- 2b. verify each contact is still in the role ----------
// A separate, quick search per person that looks specifically for departures,
// newer roles, or recent confirmation. Runs in parallel on the faster model.

const verifyTool: Anthropic.Tool = {
  name: "save_check",
  description: "Save whether the person is still in the role.",
  input_schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["current", "left", "unclear"] },
      note: { type: "string", description: "One short line, e.g. 'Quoted as VP FP&A in Oct 2026 press release' or 'Left Sep 2026; now CFO at Acme'." },
      url: { type: "string", description: "The source for the newest evidence." },
      date: { type: "string", description: "Date of that evidence, YYYY-MM-DD or YYYY-MM; empty if unknown." },
    },
    required: ["status", "note", "url", "date"],
  },
};

async function verifyContacts(raw: Omit<Contact, "confidence">[], company: string): Promise<Contact[]> {
  const checked = await Promise.all(
    raw.map(async (c) => {
      let verify: ContactCheck | undefined;
      try {
        const { input } = await runAgent<Omit<ContactCheck, "checkedAt">>({
          model: "fast",
          system: `You verify whether a person still holds a job. Today is ${today()}.
Search for the person by name and company. Look for: announcements that they left or joined elsewhere, a newer title, recent press/interviews/filings naming them in the role, and search-result snippets from profile pages.
- "left": a credible source shows they left or now work elsewhere.
- "current": a source from the last 6 months shows them in this role (or the role page lists them now).
- "unclear": nothing recent either way.
Never guess. Call save_check once.`,
          prompt: `Person: ${c.name}\nRole: ${c.title}\nCompany: ${company}\nOriginal source (${c.sourceDate || "date unknown"}): ${c.sourceUrl}`,
          finalTool: verifyTool,
          maxSearches: 3,
          maxTokens: 2000,
        });
        verify = { ...input, checkedAt: new Date().toISOString() };
      } catch {
        verify = undefined; // verification failed; fall back to the original source date
      }
      return { ...c, verify, confidence: finalConfidence(c.sourceDate, verify) };
    }),
  );
  // People who left go to the bottom so you never call them first.
  return checked.sort((a, b) => Number(a.verify?.status === "left") - Number(b.verify?.status === "left"));
}

// ---------- 3. draft the ICP from the seller's own website ----------

const icpTool: Anthropic.Tool = {
  name: "save_icp",
  description: "Save the drafted ICP.",
  input_schema: {
    type: "object",
    properties: {
      sellerCompany: { type: "string" },
      whatYouSell: { type: "string", description: "One or two plain sentences." },
      industries: { type: "array", items: { type: "string" }, maxItems: 6 },
      sizeMin: { type: "number" },
      sizeMax: { type: "number" },
      personas: { type: "array", items: { type: "string" }, maxItems: 6, description: "Job titles that buy or champion this." },
      disqualifiers: { type: "array", items: { type: "string" }, maxItems: 5 },
      notes: { type: "string", description: "Buying triggers and anything else a prospector should know." },
    },
    required: ["sellerCompany", "whatYouSell", "industries", "sizeMin", "sizeMax", "personas", "disqualifiers", "notes"],
  },
};

export async function draftIcpFromSite(url: string): Promise<Partial<Icp>> {
  const pages = await readCompanySite(url);
  const pageText = pages.map((p) => `<page url="${p.url}">\n${p.text}\n</page>`).join("\n\n");
  const { input } = await runAgent<Partial<Icp>>({
    system: `You are a B2B go-to-market strategist. From the seller's own website, draft the ideal customer profile a prospector should hunt. Be specific and practical. Call save_icp once.`,
    prompt: `The seller's website pages:\n\n${pageText}`,
    finalTool: icpTool,
    maxSearches: 0,
    maxTokens: 4000,
  });
  return input;
}
