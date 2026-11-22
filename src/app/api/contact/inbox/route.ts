import { isOwner } from "@/lib/owner";
import { getSubmission, getSubmissions, saveSubmission, storageReady } from "@/lib/store";

// Dante's private inbox. Requires the owner key.
function guard(req: Request) {
  if (!storageReady()) return Response.json({ error: "Database not connected." }, { status: 503 });
  if (!isOwner(req)) return Response.json({ error: "Owner sign-in required." }, { status: 401 });
  return null;
}

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  return Response.json({ submissions: await getSubmissions() });
}

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !["new", "saved", "dismissed"].includes(status ?? "")) return Response.json({ error: "Bad request." }, { status: 400 });
  const s = await getSubmission(id);
  if (!s) return Response.json({ error: "Not found." }, { status: 404 });
  await saveSubmission({ ...s, status: status as "new" | "saved" | "dismissed" });
  return Response.json({ ok: true });
}
