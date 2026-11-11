import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return (
    <main id="main-content">
      <PageSkeleton variant="focus" />
    </main>
  );
}
