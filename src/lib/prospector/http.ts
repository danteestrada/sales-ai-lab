import { MissingKeyError } from "../anthropic";
import { FetchError } from "../fetch-site";
import { isOwner } from "../owner";
import { StorageMissingError, storageReady } from "../store";
import { errText } from "./engine";

// Shared checks and error handling for the Prospector API routes.

export function ownerGuard(req: Request): Response | null {
  if (!storageReady()) return Response.json({ error: "The database isn't connected yet. Add Upstash in Vercel → Storage." }, { status: 503 });
  if (!process.env.OWNER_KEY) return Response.json({ error: "OWNER_KEY isn't set in Vercel yet." }, { status: 503 });
  if (!isOwner(req)) return Response.json({ error: "Owner sign-in required." }, { status: 401 });
  return null;
}

export function fail(e: unknown): Response {
  if (e instanceof StorageMissingError) return Response.json({ error: "The database isn't connected yet." }, { status: 503 });
  if (e instanceof MissingKeyError) return Response.json({ error: "The AI isn't connected (missing API key)." }, { status: 503 });
  if (e instanceof FetchError) return Response.json({ error: e.message }, { status: 422 });
  console.error("prospector error", e);
  return Response.json({ error: errText(e) }, { status: 500 });
}

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
