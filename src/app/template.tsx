import type { ReactNode } from "react";

/**
 * Route-level transition. Opacity only: transform on a wrapper would create a
 * containing block and break fixed-position UI inside pages.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-fade">{children}</div>;
}
