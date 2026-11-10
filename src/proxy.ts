import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Pass the request path through to server components.
 *
 * The root layout enforces auth/role gates with `redirect()`. Layout-level
 * redirects are the only ones that reliably produce a 307: a `redirect()`
 * thrown inside a page wrapped by `loading.tsx` fires after the shell has
 * streamed, so the status is stuck at 200 with an empty shell. The layout
 * runs before anything streams, so its redirects are always clean.
 *
 * This proxy does no gating itself — it only exposes the pathname (plus
 * query string, so `?next=` survives) as a request header.
 */
export default function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: API routes and static assets never need the header.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
