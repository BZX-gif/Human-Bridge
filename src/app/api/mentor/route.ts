import { fail, handleRoute, ok } from "@/lib/api/response";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { askMentor } from "@/lib/ai/mentor";
import { mentorMessageSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Career mentor. Uses the configured provider when available and falls back to
 * a grounded guided response when it is not. It is never a dead end.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const limit = rateLimit(clientKey(request, `mentor:${user.id}`), 20, 300);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "You are sending messages too quickly. Please wait a moment.");
    }
    const body = mentorMessageSchema.parse(await request.json());
    const reply = await askMentor(user.id, body.message, body.history ?? []);
    return ok(reply);
  });
}
