"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerUser } from "@/actions/register";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await registerUser({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created — sign in to continue.");
        router.push("/sign-in");
        return;
      }

      router.push("/menu");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-black text-white">Create your account</h1>
        <p className="mt-1 text-sm text-gray-400">Build your XI and start bidding.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" name="username" type="text" autoComplete="username" />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-squad-accent px-4 py-2 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
        >
          {isPending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-squad-accent hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-gray-300">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-gray-100 outline-none focus:border-squad-accent"
      />
    </label>
  );
}
