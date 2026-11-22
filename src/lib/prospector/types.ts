// Shapes of everything the Prospector stores.

export type Criterion = {
  id: string;
  name: string;
  description: string; // what a 5 looks like vs a 0
  weight: number; // percent; all weights sum to 100
};

export type Icp = {
  sellerCompany: string; // who you sell for, e.g. "Databricks"
  whatYouSell: string; // one or two sentences
  industries: string[];
  regions: string[]; // e.g. "US - Texas", "North America", "UK"
  sizeMin: number; // employees
  sizeMax: number;
  personas: string[]; // titles you want to reach
  disqualifiers: string[]; // e.g. "Already uses a direct competitor"
  notes: string; // anything else the AI should know
};

export type Settings = {
  icp: Icp;
  rubric: Criterion[];
  nightlyAccounts: number; // how many accounts the background run researches per night
  updatedAt: string;
};

export type Evidence = { fact: string; url: string; date: string }; // date = YYYY-MM or YYYY-MM-DD, or "" if unknown

export type CriterionScore = {
  id: string;
  score: number; // 0-5
  reasoning: string;
  evidence: Evidence[];
};

export type Confidence = "high" | "medium" | "low";

export type Contact = {
  name: string;
  title: string;
  sourceUrl: string;
  sourceDate: string; // when the source named them in this role
  confidence: Confidence; // computed in code from sourceDate
  check?: "correct" | "wrong"; // your spot-check
};

export type Research = {
  researchedAt: string;
  whyNow: string;
  whyNot: string;
  disqualified: boolean;
  disqualifiedReason: string;
  criteria: CriterionScore[];
  contacts: Contact[];
  personasToTarget: string[];
  opener: string;
  searchesUsed: number;
};

export type Feedback = {
  verdict: "up" | "down";
  reasons: string[];
  note: string;
  at: string;
};

export type Account = {
  id: string;
  name: string;
  domain: string;
  hq: string;
  region: string;
  industry: string;
  employees: string; // estimate as text, e.g. "1,000-5,000"
  discoveryReason: string;
  discoveredAt: string;
  status: "queued" | "researching" | "done" | "error";
  error?: string;
  research?: Research;
  score?: number; // 0-100, computed in code
  feedback?: Feedback;
  hidden?: boolean;
};

export type WeightChange = {
  at: string;
  account: string;
  verdict: "up" | "down";
  changes: { id: string; name: string; from: number; to: number }[];
};

export type RunLog = {
  at: string;
  kind: "discover" | "research" | "cron";
  trigger: "manual" | "nightly";
  summary: string;
  ok: boolean;
};

export type Workspace = {
  settings: Settings;
  accounts: Account[];
  queue: string[];
  weightLog: WeightChange[];
  runs: RunLog[];
};
