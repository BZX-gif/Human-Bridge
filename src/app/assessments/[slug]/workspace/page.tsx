import { notFound, redirect } from "next/navigation";
import { getBlueprint, startAttempt } from "@/lib/services/assessment-service";
import { getCurrentUser } from "@/lib/auth/session";
import { getScenario } from "@/lib/seed/seed";
import { AssessmentWorkspace } from "@/components/assessment/AssessmentWorkspace";
import {
  DATASET_COLUMNS,
  DATASET_KEY,
  computeDatasetFacts,
  generateOrders,
} from "@/lib/assessment/datasets/northwind-commerce";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/assessments/${slug}/workspace`);

  let blueprint;
  try {
    blueprint = await getBlueprint(slug);
  } catch {
    notFound();
  }

  // Resumes an in-progress attempt, or creates a new one.
  const attempt = await startAttempt(user.id, slug);

  if (attempt.status !== "in_progress") {
    redirect(`/assessments/attempt/${attempt.attemptId}/result`);
  }

  const rows = generateOrders();
  const facts = computeDatasetFacts(rows);

  return (
    <AssessmentWorkspace
      blueprint={blueprint}
      attemptId={attempt.attemptId}
      scenario={getScenario(slug) ?? blueprint.summary ?? ""}
      dataset={{
        datasetKey: DATASET_KEY,
        columns: DATASET_COLUMNS as string[],
        rows: rows.slice(0, 25) as unknown as Record<string, string | number>[],
        totalRows: facts.totalRows,
      }}
    />
  );
}
