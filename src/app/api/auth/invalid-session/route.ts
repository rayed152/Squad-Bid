import { NextResponse } from "next/server";

// Hit whenever a session cookie's user no longer exists in the database
// (see src/lib/session.ts). Clears both the plain and `__Secure-` prefixed
// cookie names next-auth uses (only one is ever actually set, depending on
// whether NEXTAUTH_URL is http or https — setting the other is a no-op)
// and sends the browser to sign-in with a fresh, cookie-free request.
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/sign-in", req.url));
  for (const name of ["next-auth.session-token", "__Secure-next-auth.session-token"]) {
    res.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return res;
}
