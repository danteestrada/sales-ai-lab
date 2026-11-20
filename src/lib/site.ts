// Everything about Dante that appears on the site lives here, so edits happen in one place.

export const person = {
  name: "Dante Estrada",
  headline: "B2B SaaS seller who builds his own AI tools",
  location: "Houston, TX",
  email: "dante.estrada@outlook.com",
  linkedin: "https://www.linkedin.com/in/dante-estrada1",
  github: "https://github.com/danteestrada/sales-ai-lab",
};

export const credentials = [
  { title: "BBA, Finance & Entrepreneurship", org: "Baylor University", note: "Talk ROI, payback and risk with finance buyers" },
  { title: "AWS Certified Cloud Practitioner", org: "Amazon Web Services", note: "How cloud economics and architecture actually work" },
  { title: "AWS Certified AI Practitioner", org: "Amazon Web Services", note: "What AI can and can't do, so I don't overpromise it" },
  { title: "Databricks Fundamentals", org: "Databricks", note: "How data platforms fit into the AI stack" },
];

export type ToolStatus = "live" | "building" | "planned";

export const tools: {
  slug: string;
  name: string;
  oneLiner: string;
  impact: string;
  status: ToolStatus;
  eta?: string;
}[] = [
  {
    slug: "product-brain",
    name: "Product Brain",
    oneLiner: "Paste any company's website. Get its ICP, buyer personas, value props, competitors and proof points — with every claim marked as sourced or inferred.",
    impact: "Every other tool runs on it, so the whole lab works for AWS, iDeals or anyone else.",
    status: "live",
  },
  {
    slug: "deal-desk",
    name: "Deal Desk",
    oneLiner: "Scores pipeline risk, tells you when to cut bait and where those hours go instead — and argues back honestly when you disagree.",
    impact: "Includes The Meeting You're Not In: AI buyers debate your proposal so you see where it dies.",
    status: "building",
    eta: "December",
  },
  {
    slug: "champion-kit",
    name: "Champion Kit",
    oneLiner: "Writes the internal business case your champion forwards to their CFO: payback, NPV, risks, and answers to procurement and security.",
    impact: "Built for the buyer, not the seller. The math runs in code, not in the AI's head.",
    status: "planned",
    eta: "December",
  },
  {
    slug: "fact-checker",
    name: "Outreach Fact-Checker",
    oneLiner: "Checks every claim in a cold email against live sources, flags what's wrong, and scores relevance — not just personalization.",
    impact: "94% of B2B buyers fact-check AI. This makes sure your outreach survives it.",
    status: "planned",
    eta: "December",
  },
  {
    slug: "prospector",
    name: "ICP Prospector",
    oneLiner: "Finds accounts that fit now, explains why in plain English, verifies contacts are still in seat, and learns from your feedback.",
    impact: "Every contact carries a verified-on date and a confidence level instead of pretending.",
    status: "planned",
    eta: "January",
  },
  {
    slug: "call-coach",
    name: "Live Call Coach",
    oneLiner: "Practice against a skeptical AI buyer out loud, with live coaching cards in your own voice and a scorecard after.",
    impact: "Live mode listens to real calls and surfaces objection responses in about two seconds.",
    status: "planned",
    eta: "January",
  },
];
