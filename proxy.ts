import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (!session?.user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callback", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const onboarded = !!session.user.onboardedAt;
  if (!onboarded && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (onboarded && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/practice", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vocabulary/:path*",
    "/practice/:path*",
    "/partner/:path*",
    "/settings/:path*",
    "/onboarding",
  ],
};