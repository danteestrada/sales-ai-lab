import { addAccountManually } from "@/lib/prospector/engine";
import { body, fail, ownerGuard } from "@/lib/prospector/http";

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const { name, domain } = await body<{ name: string; domain: string }>(req);
    if (!name?.trim()) return Response.json({ error: "Add a company name." }, { status: 400 });
    return Response.json({ account: await addAccountManually("owner", name.slice(0, 100), (domain ?? "").slice(0, 100)) });
  } catch (e) {
    return fail(e);
  }
}
