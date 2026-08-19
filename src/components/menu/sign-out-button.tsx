"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-squad-border px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-white/30 hover:text-gray-200"
    >
      Sign out
    </button>
  );
}
