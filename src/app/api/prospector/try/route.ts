import { feedbackNotes, researchAccount } from "@/lib/prospector/ai";
import { redactForPublic, settingsReady } from "@/lib/prospector/engine";
import { body, fail } from "@/lib/prospector/http";
import { scoreAccount } from "@/lib/prospector/scoring";
import type { Account } from "@/lib/prospector/types";
import { visitorId } from "@/lib/rate-limit";
import { bumpDaily, getAccounts, getSettings, storageReady } from "@/lib/store";

export const maxDuration = 300;

const PER_VISITOR = Number(process.env.TRY_PER_VISITOR_DAILY ?? 2);
const SITE_CAP = Number(process.env.TRY_SITE_DAILY_CAP ?? 30);

// Visitors can research one company live against the demo ICP. Nothing is saved.
export async function POST(req: Request) {
  if (!storageReady()) return Response.json({ error: "The demo isn't set up yet." }, { status: 503 });
  try {
    const { name } = await body<{ name: string }>(req);
    if (!name?.trim() || name.length > 100) return Response.json({ error: "Type a company name." }, { status: 400 });
    const settings = await getSettings("demo");
    if (settingsReady(settings)) return Response.json({ error: "The demo ICP isn't published yet." }, { status: 503 });
    if ((await bumpDaily("try:site")) > SITE_CAP) return Response.json({ error: "The live demo hit today's limit. Try again tomorrow, or reach out for a walkthrough." }, { status: 429 });
    if ((await bumpDaily(`try:${visitorId(req)}`)) > PER_VISITOR) return Response.json({ error: `You've used today's ${PER_VISITOR} live runs. Come back tomorrow, or reach out for a walkthrough.` }, { status: 429 });
    const notes = feedbackNotes(await getAccounts("demo"));
    const { research, company } = await researchAccount(settings, { name: name.trim(), domain: "" }, notes);
    const account: Account = {
      id: "try",
      name: company?.name || name.trim(),
      domain: company?.domain ?? "",
      hq: company?.hq ?? "",
      region: company?.region ?? "",
      industry: company?.industry ?? "",
      employees: company?.employees ?? "",
      discoveryReason: "Entered by a visitor.",
      discoveredAt: new Date().toISOString(),
      status: "done",
      research,
    };
    account.score = scoreAccount(account, settings.rubric);
    return Response.json({ account: redactForPublic(account) });
  } catch (e) {
    return fail(e);
  }
}
