"use client";

import { signIn, signOut } from "next-auth/react";

export default function AuthButton({ callback }: { callback?: string }) {
  return (
    <button
      onClick={() => signIn("google", { redirectTo: callback || "/practice" })}
      className="btn btn-primary"
    >
      Continue with Google
    </button>
  );
}

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ redirectTo: "/" })} className="text-sm text-ink-faint hover:text-ink transition-colors">
      Sign out
    </button>
  );
}