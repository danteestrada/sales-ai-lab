import { publishDemo } from "@/lib/prospector/engine";
import { fail, ownerGuard } from "@/lib/prospector/http";

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    return Response.json({ published: await publishDemo() });
  } catch (e) {
    return fail(e);
  }
}
