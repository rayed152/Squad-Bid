import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sessions use the JWT strategy (see auth.ts) — the cookie is never re-checked
// against the database, so a user id that was valid when the cookie was
// issued can go stale (account deleted, or the underlying database swapped
// out from under the app, e.g. switching DATABASE_URL between environments).
// Every protected page/action funnels through here instead of trusting
// `session.user.id` directly, so a stale session always bounces to sign-in
// instead of crashing on a missing row or a foreign-key violation.

/** For Server Components and Server Actions. Redirects to sign-in (clearing
 * the stale cookie first) if there's no session, or the session's user no
 * longer exists in the database. */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) redirect("/api/auth/invalid-session");

  return id;
}

/** For GET API routes. A `fetch()` poller can't usefully follow a page
 * redirect, so this returns null instead — the route should respond 401,
 * and the client should treat 401 as "sign out and go to /sign-in". */
export async function getValidUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  return user ? id : null;
}
