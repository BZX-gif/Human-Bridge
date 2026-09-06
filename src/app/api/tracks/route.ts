import { handleRoute, ok } from "@/lib/api/response";
import { listCareerTracks } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => ok({ tracks: await listCareerTracks() }));
}
