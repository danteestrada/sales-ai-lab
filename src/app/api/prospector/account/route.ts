import { checkContact, giveFeedback, researchInto, setHidden } from "@/lib/prospector/engine";
import { body, fail, ownerGuard } from "@/lib/prospector/http";
import { getAccount } from "@/lib/store";

export const maxDuration = 300;

type Req = {
  id: string;
  action: "feedback" | "contact" | "hide" | "unhide" | "rerun";
  verdict: "up" | "down";
  reasons: string[];
  note: string;
  index: number;
  check: "correct" | "wrong" | null;
};

export async function POST(req: Request) {
  const denied = ownerGuard(req);
  if (denied) return denied;
  try {
    const b = await body<Req>(req);
    if (!b.id) return Response.json({ error: "Missing account id." }, { status: 400 });
    switch (b.action) {
      case "feedback": {
        if (b.verdict !== "up" && b.verdict !== "down") return Response.json({ error: "Pick up or down." }, { status: 400 });
        const change = await giveFeedback("owner", b.id, {
          verdict: b.verdict,
          reasons: (b.reasons ?? []).slice(0, 8).map(String),
          note: String(b.note ?? "").slice(0, 500),
        });
        return Response.json({ change });
      }
      case "contact":
        await checkContact("owner", b.id, Number(b.index), b.check ?? null);
        return Response.json({ ok: true });
      case "hide":
      case "unhide":
        await setHidden("owner", b.id, b.action === "hide");
        return Response.json({ ok: true });
      case "rerun": {
        const a = await getAccount("owner", b.id);
        if (!a) return Response.json({ error: "Account not found." }, { status: 404 });
        return Response.json({ account: await researchInto("owner", a, "manual") });
      }
      default:
        return Response.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (e) {
    return fail(e);
  }
}
