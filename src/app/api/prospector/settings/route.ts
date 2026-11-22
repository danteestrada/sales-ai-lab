import { rescoreAll } from "@/lib/prospector/engine";
import { body, fail, ownerGuard } from "@/lib/prospector/http";
import { normalizeWeights } from "@/lib/prospector/scoring";
import type { Settings } from "@/lib/prospector/types";
import { saveSettings } from "@/lib/store";

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const s = await body<Settings>(req);
    if (!s.icp || !s.rubric?.length) return Response.json({ error: "Missing ICP or rubric." }, { status: 400 });
    const rubric = normalizeWeights(
      s.rubric.map((c, i) => ({
        id: (c.id || `c${i}`).slice(0, 30),
        name: String(c.name ?? "").slice(0, 60),
        description: String(c.description ?? "").slice(0, 400),
        weight: Number(c.weight) || 0,
      })),
    );
    const settings: Settings = {
      icp: s.icp,
      rubric,
      nightlyAccounts: Math.min(10, Math.max(0, Number(s.nightlyAccounts ?? 3))),
      updatedAt: new Date().toISOString(),
    };
    await saveSettings("owner", settings);
    await rescoreAll("owner");
    return Response.json({ settings });
  } catch (e) {
    return fail(e);
  }
}
