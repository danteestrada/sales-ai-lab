import type { Criterion, Settings } from "./types";

// A starting rubric that works for most B2B SaaS. Every part is editable in the app.
export const DEFAULT_RUBRIC: Criterion[] = [
  {
    id: "fit",
    name: "ICP fit",
    description: "5 = squarely in the target industry, size and region. 0 = outside them.",
    weight: 25,
  },
  {
    id: "priority",
    name: "Stated priority",
    description:
      "5 = the company publicly says the problem we solve is a priority (earnings call, annual report, exec interview, strategy announcement). 0 = no sign it matters to them.",
    weight: 25,
  },
  {
    id: "change",
    name: "Change event",
    description:
      "5 = in the last 12 months: new exec in a buying role, acquisition, funding, IPO prep, restructuring, new market or system migration. 0 = nothing changed.",
    weight: 20,
  },
  {
    id: "capacity",
    name: "Capacity to buy",
    description: "5 = growing, funded or profitable, investing. 0 = layoffs, distress, spending freeze.",
    weight: 15,
  },
  {
    id: "reach",
    name: "Reachability",
    description: "5 = named people in our buying personas are publicly identifiable, with a clear angle to reach them. 0 = no identifiable buyer.",
    weight: 15,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  icp: {
    sellerCompany: "",
    whatYouSell: "",
    industries: [],
    regions: ["United States"],
    sizeMin: 200,
    sizeMax: 5000,
    personas: [],
    disqualifiers: ["Recently bought a direct competitor's product", "In bankruptcy or major distress"],
    notes: "",
  },
  rubric: DEFAULT_RUBRIC,
  nightlyAccounts: 3,
  updatedAt: new Date(0).toISOString(),
};

export const FEEDBACK_REASONS = {
  up: ["Great fit", "Strong timing", "Right contacts", "Good opener"],
  down: ["Wrong industry", "Too small", "Too big", "Wrong region", "Bad timing", "Already a customer elsewhere", "Weak evidence", "Wrong contacts"],
};
