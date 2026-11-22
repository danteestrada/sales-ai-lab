// Everything about Dante that appears on the site lives here, so edits happen in one place.

export const person = {
  name: "Dante Estrada",
  headline: "B2B SaaS seller who builds his own AI tools",
  location: "Houston, TX",
  email: "dante.estrada@outlook.com",
  linkedin: "https://www.linkedin.com/in/dante-estrada1",
  github: "https://github.com/danteestrada/sales-ai-lab",
};

import type { IconKind } from "@/components/icons";

export const credentials: { title: string; org: string; note: string; icon: IconKind }[] = [
  { title: "BBA, Finance & Entrepreneurship", org: "Baylor University", icon: "degree", note: "I can talk payback and ROI with a CFO" },
  { title: "AWS Certified Cloud Practitioner", org: "Amazon Web Services", icon: "cloud", note: "How cloud costs and architecture work" },
  { title: "AWS Certified AI Practitioner", org: "Amazon Web Services", icon: "ai", note: "What AI can and can't do for a customer" },
  { title: "Databricks Fundamentals", org: "Databricks", icon: "data", note: "Where data platforms fit in an AI project" },
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
    slug: "prospector",
    name: "ICP Prospector",
    oneLiner: "Finds companies that fit your ICP right now, shows you why with dated sources, and checks that each contact still works there.",
    impact: "In my first test, 1 of 4 contacts had already left. Now every name gets a second check for departures before it reaches you.",
    status: "live",
  },
  {
    slug: "deal-desk",
    name: "Deal Desk",
    oneLiner: "Reviews your pipeline, flags the deals that are stalling, and tells you when to walk away and where to spend that time instead.",
    impact: "You can argue with it. New facts change its mind. Wishful thinking doesn't.",
    status: "planned",
    eta: "December",
  },
  {
    slug: "champion-kit",
    name: "Champion Kit",
    oneLiner: "Builds the business case your champion forwards to their CFO: payback, NPV, risks, and answers for procurement and security.",
    impact: "Built for the buyer. The math runs in code, so every number can be checked.",
    status: "planned",
    eta: "December",
  },
  {
    slug: "fact-checker",
    name: "Outreach Fact-Checker",
    oneLiner: "Checks every claim in a cold email against live sources before you send it, and tells you if the email is relevant to the buyer.",
    impact: "Buyers fact-check AI-written outreach. This catches the mistakes first.",
    status: "planned",
    eta: "December",
  },
  {
    slug: "call-coach",
    name: "Live Call Coach",
    oneLiner: "Practice cold calls out loud against an AI buyer who pushes back, with coaching cards while you talk and a scorecard at the end.",
    impact: "Later: live help on real calls, in your own words.",
    status: "planned",
    eta: "January",
  },
];
