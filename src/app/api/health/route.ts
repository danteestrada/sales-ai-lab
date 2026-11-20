import { connection } from "next/server";
import { getClient, MissingKeyError, MODELS } from "@/lib/anthropic";

// The "AI status" check: confirms the API key works with a tiny, cheap request.
export async function GET() {
  await connection(); // always run live, never prerender at build time
  try {
    const msg = await getClient().messages.create({
      model: MODELS.fast,
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with the single word: connected" }],
    });
    const text = msg.content.find((b) => b.type === "text");
    return Response.json({ status: "connected", reply: text?.type === "text" ? text.text.trim() : "" });
  } catch (e) {
    if (e instanceof MissingKeyError) {
      return Response.json({ status: "missing_key", message: "No API key found. Add ANTHROPIC_API_KEY in Vercel, then redeploy." }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", message }, { status: 502 });
  }
}
