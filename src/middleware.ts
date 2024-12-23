import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-key"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session-token")?.value;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/api/process",
    "/api/users",
  ],
};
