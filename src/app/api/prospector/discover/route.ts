import { runDiscovery } from "@/lib/prospector/engine";
import { body, fail, ownerGuard } from "@/lib/prospector/http";

export const maxDuration = 300;

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const { count } = await body<{ count: number }>(req);
    const added = await runDiscovery("owner", "manual", Math.min(12, Math.max(1, Number(count) || 8)));
    return Response.json({ added });
  } catch (e) {
    return fail(e);
  }
}
