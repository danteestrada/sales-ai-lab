import { isOwner } from "@/lib/owner";
import { redactForPublic } from "@/lib/prospector/engine";
import { fail } from "@/lib/prospector/http";
import { getWorkspace, storageReady } from "@/lib/store";

// Returns a workspace. Owners get their real one; everyone else gets the public demo.
export async function GET(req: Request) {
  const owner = isOwner(req);
  const setup = { storage: storageReady(), ownerKeySet: Boolean(process.env.OWNER_KEY), cronSet: Boolean(process.env.CRON_SECRET) };
  if (!setup.storage) return Response.json({ owner, setup, workspace: null });
  try {
    const ws = await getWorkspace(owner ? "owner" : "demo");
    if (!owner) {
      ws.accounts = ws.accounts.filter((a) => !a.hidden).map(redactForPublic);
      ws.runs = [];
    }
    return Response.json({ owner, setup, workspace: ws });
  } catch (e) {
    return fail(e);
  }
}
