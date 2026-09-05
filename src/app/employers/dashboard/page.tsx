import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import {
  findApplicationsForCompany,
  getCompanyForUser,
  listCompanyJobs,
} from "@/lib/services/employer-service";
import { EmployerDashboard } from "@/components/employer/EmployerDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Employer dashboard — Human Bridge" };

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/employers/dashboard");
  if (user.role !== "employer") redirect("/dashboard");

  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/employers");

  const jobs = await listCompanyJobs(company.id);
  const applications = await findApplicationsForCompany(company.id);

  return (
    <EmployerDashboard
      companyName={company.name}
      jobs={jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        location: job.location ?? "Not specified",
        workType: job.workType,
        postedAt: job.postedAt.toISOString(),
        requiredSkills: job.requiredSkills.map((s) => ({
          slug: s.slug,
          name: s.name,
          importance: s.importance,
          requiredScore: s.requiredScore,
        })),
        applicantCount: applications.filter((a) => a.job.id === job.id).length,
      }))}
      applications={applications.map((r) => ({
        id: r.application.id,
        status: r.application.status,
        matchScore: r.application.matchScore,
        appliedAt: r.application.appliedAt.toISOString(),
        jobId: r.job.id,
        jobTitle: r.job.title,
        candidateName: r.user.name,
      }))}
    />
  );
}
