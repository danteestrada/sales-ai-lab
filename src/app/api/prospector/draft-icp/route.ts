import { draftIcpFromSite } from "@/lib/prospector/ai";
import { body, fail, ownerGuard } from "@/lib/prospector/http";

export const maxDuration = 120;

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const { url } = await body<{ url: string }>(req);
    if (!url) return Response.json({ error: "Send your company's website." }, { status: 400 });
    return Response.json({ icp: await draftIcpFromSite(url) });
  } catch (e) {
    return fail(e);
  }
}
