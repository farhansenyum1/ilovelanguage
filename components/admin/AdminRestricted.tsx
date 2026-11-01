import Link from "next/link";

export default function AdminRestricted({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card p-8 space-y-4 text-center">
        <p className="eyebrow">Restricted</p>
        <h1 className="display text-2xl">Admin access</h1>
        <p className="text-sm text-ink-muted">
          {signedIn
            ? "Akun ini bukan admin. Minta owner mempromosikan role-mu."
            : "Masuk dulu dengan Google untuk membuka console."}
        </p>
        <Link href={signedIn ? "/practice" : "/"} className="btn btn-primary inline-flex">
          {signedIn ? "Back to practice" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}