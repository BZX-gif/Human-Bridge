export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "candidate" | "employer" | "admin";
  companyId: number | null;
  targetCareerId: number | null;
  onboardingComplete: boolean;
}
