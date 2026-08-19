"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push(searchParams.get("callbackUrl") ?? "/menu");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-400">Sign in to find your next match.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-300">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-gray-100 outline-none focus:border-squad-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-300">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-gray-100 outline-none focus:border-squad-accent"
          />
        </label>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-squad-accent px-4 py-2 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        Need an account?{" "}
        <Link href="/sign-up" className="font-semibold text-squad-accent hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
