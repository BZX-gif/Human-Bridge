import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/ai";
import { CopilotChat } from "@/components/copilot/CopilotChat";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Career Copilot — Human Bridge",
  description:
    "Ask about your skill gaps, your evidence and your target role. Grounded in your real assessment data.",
};

export default async function CopilotPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/ai-copilot");

  return <CopilotChat available={isAiConfigured()} userName={user.name.split(" ")[0]} />;
}
