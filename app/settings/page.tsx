import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import SettingsForm from "@/components/settings/SettingsForm";

export const metadata = { title: "Settings — iLoveLanguage" };

async function SettingsContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/");

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 space-y-8">
      <header className="space-y-2">
        <p className="eyebrow">Account</p>
        <h1 className="display text-4xl md:text-5xl">
          Your <span className="italic text-gold">profile</span>
        </h1>
        <p className="text-ink-muted max-w-lg">Atur identitas dan foto profil yang tampil di seluruh aplikasi.</p>
      </header>

      <SettingsForm
        initial={{
          username: user.username ?? "",
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          image: user.image ?? null,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto py-10 space-y-6">
          <div className="h-10 w-48 rounded bg-hairline/60 animate-pulse" />
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            <div className="card h-80 animate-pulse" />
            <div className="card h-80 animate-pulse" />
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}