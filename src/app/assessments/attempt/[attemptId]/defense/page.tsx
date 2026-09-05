import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedAttempt } from "@/lib/services/assessment-service";
import { generateDefense } from "@/lib/services/evaluation-service";
import { DefenseRound } from "@/components/assessment/DefenseRound";

export const dynamic = "force-dynamic";

export default async function DefensePage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: raw } = await params;
  const attemptId = Number(raw);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/assessments/attempt/${raw}/defense`);
  if (!Number.isInteger(attemptId)) redirect("/assessments");

  const attempt = await getOwnedAttempt(attemptId, user.id);
  if (attempt.status === "in_progress") {
    redirect("/assessments");
  }
  if (attempt.status === "passed" || attempt.status === "failed") {
    redirect(`/assessments/attempt/${attemptId}/result`);
  }

  const questions = await generateDefense(attemptId, user.id);

  return <DefenseRound attemptId={attemptId} questions={questions} />;
}
