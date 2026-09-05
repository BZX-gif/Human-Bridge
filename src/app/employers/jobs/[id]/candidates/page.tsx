import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import {
  assertJobOwnership,
  getCompanyForUser,
  listJobCandidates,
} from "@/lib/services/employer-service";
import { CandidateReview } from "@/components/employer/CandidateReview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Candidates — Human Bridge" };

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/employers/jobs/${id}/candidates`);
  if (user.role !== "employer") redirect("/dashboard");
  if (!Number.isInteger(jobId)) notFound();

  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/employers");

  // Authorisation: throws NOT_FOUND if the job belongs to another company.
  let job;
  try {
    job = await assertJobOwnership(jobId, company.id);
  } catch {
    notFound();
  }

  const candidates = await listJobCandidates(jobId, company.id);

  return <CandidateReview jobTitle={job.title} candidates={candidates} />;
}
