import { researchNext } from "@/lib/prospector/engine";
import { fail, ownerGuard } from "@/lib/prospector/http";
import { queueLength } from "@/lib/store";

export const maxDuration = 300;

// Researches ONE queued account per call. The page calls this repeatedly,
// so each account gets its own 5-minute window.
export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const account = await researchNext("owner", "manual");
    return Response.json({ account, remaining: await queueLength("owner") });
  } catch (e) {
    return fail(e);
  }
}
