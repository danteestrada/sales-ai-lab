import type Anthropic from "@anthropic-ai/sdk";

// The profile every tool in the lab reads from.
// "basis" keeps the AI honest: "site" = stated on the company's own pages,
// "inferred" = Claude's reasoning from what it read, which a human should verify.

export type Basis = "site" | "inferred";

export type Profile = {
  company: string;
  website: string;
  oneLiner: string;
  whatTheySell: { item: string; basis: Basis }[];
  icp: {
    industries: { item: string; basis: Basis }[];
    companySize: { item: string; basis: Basis };
    regions: { item: string; basis: Basis }[];
    buyingTriggers: { item: string; basis: Basis }[];
  };
  personas: { title: string; caresAbout: string; basis: Basis }[];
  valueProps: { claim: string; evidence: string; basis: Basis }[];
  competitors: { name: string; basis: Basis }[];
  proofPoints: { customer: string; result: string; sourceUrl: string }[];
  openQuestions: string[];
  sourcesRead: string[];
};

const basis = { type: "string", enum: ["site", "inferred"] } as const;
const tagged = {
  type: "object",
  properties: { item: { type: "string" }, basis },
  required: ["item", "basis"],
} as const;

export const profileTool: Anthropic.Tool = {
  name: "save_profile",
  description: "Save the structured go-to-market profile of the company.",
  input_schema: {
    type: "object",
    properties: {
      company: { type: "string" },
      oneLiner: { type: "string", description: "One plain sentence: what they sell and to whom. No marketing language." },
      whatTheySell: { type: "array", items: tagged, maxItems: 6 },
      icp: {
        type: "object",
        properties: {
          industries: { type: "array", items: tagged, maxItems: 6 },
          companySize: tagged,
          regions: { type: "array", items: tagged, maxItems: 4 },
          buyingTriggers: {
            type: "array",
            items: tagged,
            maxItems: 5,
            description: "Events that make a company likely to buy now (e.g. new CFO, failed audit, rapid hiring).",
          },
        },
        required: ["industries", "companySize", "regions", "buyingTriggers"],
      },
      personas: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            caresAbout: { type: "string", description: "What this buyer is measured on, in their language." },
            basis,
          },
          required: ["title", "caresAbout", "basis"],
        },
      },
      valueProps: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            evidence: { type: "string", description: "What on the site backs this up, or why it's inferred." },
            basis,
          },
          required: ["claim", "evidence", "basis"],
        },
      },
      competitors: {
        type: "array",
        maxItems: 6,
        items: { type: "object", properties: { name: { type: "string" }, basis }, required: ["name", "basis"] },
      },
      proofPoints: {
        type: "array",
        maxItems: 5,
        description: "Only named customers or concrete results that appear in the pages provided. Empty if none.",
        items: {
          type: "object",
          properties: {
            customer: { type: "string" },
            result: { type: "string" },
            sourceUrl: { type: "string", description: "The page URL it appeared on." },
          },
          required: ["customer", "result", "sourceUrl"],
        },
      },
      openQuestions: {
        type: "array",
        maxItems: 5,
        items: { type: "string" },
        description: "What a seller still needs to confirm because the site didn't say.",
      },
    },
    required: ["company", "oneLiner", "whatTheySell", "icp", "personas", "valueProps", "competitors", "proofPoints", "openQuestions"],
  },
};

export const SYSTEM_PROMPT = `You are a senior B2B sales strategist building a go-to-market profile of a company from its own website, so a seller can prospect and position it accurately.

Rules:
- Use only the page text provided. Mark anything stated on those pages as basis "site". Mark anything you reasoned or know from general knowledge as basis "inferred".
- Never invent customers, numbers or quotes. Proof points must appear in the provided pages, with the page URL.
- Write like a sharp seller briefing a peer: plain, specific, no marketing adjectives ("leading", "innovative", "seamless", "cutting-edge").
- Personas: name real job titles that sign or influence the purchase, and what each is measured on.
- Competitors: name actual companies. Usually these are inferred; that's fine, label them.
- Open questions: the gaps a seller must close before relying on this profile.
- Call save_profile exactly once.`;
