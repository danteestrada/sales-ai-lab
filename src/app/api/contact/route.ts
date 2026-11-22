import { randomUUID } from "node:crypto";
import { aiScreen, emailChecks, type Submission } from "@/lib/contact";
import { visitorId } from "@/lib/rate-limit";
import { bumpDaily, saveSubmission, storageReady } from "@/lib/store";

export const maxDuration = 30;

const OK = Response.json({ ok: true, message: "Thanks. Your message came through, and Dante will reach out if it's a fit." });

// Public "Get in touch" form. Bots get the same friendly reply as people,
// so they learn nothing, but their messages are dropped or marked spam.
export async function POST(req: Request) {
  if (!storageReady()) return Response.json({ error: "The form isn't set up yet. Please reach out on LinkedIn." }, { status: 503 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "Something went wrong. Try again." }, { status: 400 });
  }
  const str = (k: string, max: number) => String(b[k] ?? "").trim().slice(0, max);

  // Trap 1: a hidden field people never see. Bots fill it in.
  if (str("website", 200)) return OK;
  // Trap 2: real people take more than a few seconds to fill out a form.
  const startedAt = Number(b.startedAt);
  if (!startedAt || Date.now() - startedAt < 4000) return OK;

  const s = {
    name: str("name", 100),
    email: str("email", 200).toLowerCase(),
    company: str("company", 120),
    title: str("title", 120),
    linkedin: str("linkedin", 300),
    hiringFor: str("hiringFor", 200),
    message: str("message", 3000),
  };
  if (!s.name || !s.company || !s.title || s.message.length < 20 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email)) {
    return Response.json({ error: "Please fill in your name, work email, company, title, and a short message (20+ characters)." }, { status: 400 });
  }
  if (s.linkedin && !/^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(s.linkedin)) {
    return Response.json({ error: "The LinkedIn field should be a linkedin.com link (or leave it blank)." }, { status: 400 });
  }

  // Trap 3: limits per visitor and per day.
  if ((await bumpDaily(`contact:${visitorId(req)}`)) > 3) return OK;
  if ((await bumpDaily("contact:site")) > 60) return OK;

  const checks = await emailChecks(s.email, s.company);
  if (!checks.mailWorks || checks.disposable) {
    return Response.json({ error: "That email address doesn't look like it can receive mail. Please use your work email." }, { status: 400 });
  }

  let screen: Submission["screen"];
  try {
    screen = await aiScreen({ ...s, checks });
  } catch {
    screen = { verdict: "other", score: 50, summary: "Not screened (the AI check failed). Review manually.", flags: ["unscreened"] };
  }

  await saveSubmission({ id: randomUUID().slice(0, 10), at: new Date().toISOString(), ...s, checks, screen, status: "new" });
  return OK;
}
