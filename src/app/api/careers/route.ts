import { handleRoute, ok } from "@/lib/api/response";
import { listCareers } from "@/lib/services/career-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => ok({ careers: await listCareers() }));
}
