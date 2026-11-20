import { getClient, MissingKeyError, MODELS } from "@/lib/anthropic";
import { FetchError, readCompanySite } from "@/lib/fetch-site";
import { profileTool, SYSTEM_PROMPT, type Profile } from "@/lib/product-brain";
import { checkLimit, visitorId } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send a website address." }, { status: 400 });
  }
  if (!body.url || body.url.length > 300) {
    return Response.json({ error: "Send a website address." }, { status: 400 });
  }

  const limit = checkLimit(visitorId(req), req.headers.get("x-owner-key"));
  if (!limit.ok) return Response.json({ error: limit.message }, { status: 429 });

  try {
    const pages = await readCompanySite(body.url);
    const pageText = pages.map((p) => `<page url="${p.url}">\n${p.text}\n</page>`).join("\n\n");

    const msg = await getClient().messages.create({
      model: MODELS.smart,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: [profileTool],
      tool_choice: { type: "tool", name: "save_profile" },
      messages: [
        {
          role: "user",
          content: `Build the profile for the company whose website pages are below.\n\n${pageText}`,
        },
      ],
    });

    const call = msg.content.find((b) => b.type === "tool_use");
    if (!call || call.type !== "tool_use") throw new Error("No profile returned");

    const profile: Profile = {
      ...(call.input as Omit<Profile, "website" | "sourcesRead">),
      website: pages[0].url,
      sourcesRead: pages.map((p) => p.url),
    };
    return Response.json({ profile, remaining: limit.remaining });
  } catch (e) {
    if (e instanceof FetchError) return Response.json({ error: e.message }, { status: 422 });
    if (e instanceof MissingKeyError) {
      return Response.json({ error: "The AI isn't connected yet (missing API key)." }, { status: 503 });
    }
    console.error("product-brain failed", e);
    return Response.json({ error: "Something went wrong building the profile. Try again in a minute." }, { status: 500 });
  }
}
