import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/menu");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-white">SquadBid</h1>
        <p className="text-sm text-gray-400">
          Bid on randomly-popped footballers, build your best XI, and outscore your opponent.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-squad-accent px-4 py-2.5 text-sm font-bold text-black transition hover:bg-squad-accent/90"
        >
          Create an account
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-squad-border bg-squad-panel px-4 py-2.5 text-sm font-bold text-gray-100 transition hover:border-white/30"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
