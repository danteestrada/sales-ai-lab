import { after } from "next/server";
import { isCron } from "@/lib/owner";
import { errText, researchNext, runDiscovery, settingsReady } from "@/lib/prospector/engine";
import { getSettings, logRun, queueLength, storageReady } from "@/lib/store";

export const maxDuration = 300;

// The nightly background run. Vercel calls this once a day (see vercel.json).
// Each call does ONE unit of work (discover, or research one account), then calls
// itself for the next step, so every step gets its own 5-minute window.
export async function GET(req: Request) {
  if (!isCron(req)) return Response.json({ error: "Not allowed." }, { status: 401 });
  if (!storageReady()) return Response.json({ error: "Database not connected." }, { status: 503 });

  const url = new URL(req.url);
  const step = Number(url.searchParams.get("step") ?? 0);
  const settings = await getSettings("owner");
  const target = settings.nightlyAccounts;
  if (target <= 0 || settingsReady(settings)) return Response.json({ skipped: true });

  let did = "nothing";
  try {
    if (step === 0 && (await queueLength("owner")) < target) {
      const added = await runDiscovery("owner", "nightly", Math.max(target, 5));
      did = `discovered ${added.length}`;
    } else {
      const a = await researchNext("owner", "nightly");
      did = a ? `researched ${a.name}` : "queue empty";
    }
  } catch (e) {
    await logRun("owner", { at: new Date().toISOString(), kind: "cron", trigger: "nightly", ok: false, summary: errText(e) });
  }

  // Steps: 0 = discover if needed, 1..target = research one account each.
  if (step < target && did !== "queue empty") {
    const next = new URL(req.url);
    next.searchParams.set("step", String(step + 1));
    after(async () => {
      try {
        await fetch(next, { headers: { authorization: req.headers.get("authorization") ?? "" }, signal: AbortSignal.timeout(10_000) });
      } catch {
        // The next step keeps running on its own; we only needed to start it.
      }
    });
  }
  return Response.json({ step, did });
}
