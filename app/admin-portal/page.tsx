import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminRestricted from "@/components/admin/AdminRestricted";

export const metadata = { title: "Overview — Admin" };

async function OverviewContent() {
  const { session, admin } = await getAdminSession();
  if (!session?.user) return <AdminRestricted signedIn={false} />;
  if (admin?.role !== "ADMIN") return <AdminRestricted signedIn={true} />;

  const [totalUsers, onboardedUsers, totalVocab, masteredVocab] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { onboardedAt: { not: null } } }),
    db.vocabEntry.count(),
    db.vocabEntry.count({ where: { status: "MASTERED" } }),
  ]);

  const topWords = await db.vocabEntry.groupBy({
    by: ["word"],
    _count: { word: true },
    orderBy: { _count: { word: "desc" } },
    take: 6,
  });

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      onboardedAt: true,
      _count: { select: { vocabEntries: true } },
    },
  });

  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  weekAgo.setHours(0, 0, 0, 0);
  const signupRows = await db.user.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { createdAt: true },
  });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      count: signupRows.filter((r) => r.createdAt.toISOString().slice(0, 10) === key).length,
    };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const stats = [
    { label: "Total users", value: totalUsers, hint: "terdaftar" },
    { label: "Onboarded", value: onboardedUsers, hint: "profil lengkap" },
    { label: "Saved words", value: totalVocab, hint: "seluruh user" },
    { label: "Mastered", value: masteredVocab, hint: "status hafal" },
  ];

  return (
    <AdminShell
      eyebrow="Console"
      title="Overview"
      description="Ringkasan aktivitas platform secara real-time."
      actions={
        <Link href="/admin-portal/ai" className="btn btn-ghost text-sm">
          AI status
        </Link>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="eyebrow">{s.label}</p>
            <p className="display text-3xl mt-2 tabular-nums">{s.value}</p>
            <p className="text-[.7rem] text-ink-faint mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="display text-lg">Signups</h2>
          <span className="text-xs text-ink-faint">7 hari terakhir</span>
        </div>
        <div className="flex items-end gap-3 h-32">
          {days.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-ink-muted">{d.count}</span>
              <div
                className="w-full rounded-t bg-gold/80"
                style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                title={`${d.key}: ${d.count}`}
              />
              <span className="text-[.65rem] text-ink-faint">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card p-6">
          <h2 className="display text-lg mb-5">Most-saved words</h2>
          {topWords.length === 0 ? (
            <p className="text-sm text-ink-faint italic font-display py-6">Belum ada kata tersimpan.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {topWords.map((w) => (
                <li key={w.word} className="flex items-center justify-between py-2.5">
                  <span className="font-display italic text-ink">{w.word}</span>
                  <span className="text-sm tabular-nums text-ink-muted">{w._count.word}x</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="display text-lg">Recent users</h2>
            <Link href="/admin-portal/users" className="text-xs text-gold hover:underline">
              Semua
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-ink-faint italic font-display py-6">Belum ada user.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "—"}
                    </p>
                    <p className="text-xs text-ink-faint truncate">{u.email}</p>
                  </div>
                  <span className="text-xs tabular-nums text-ink-muted shrink-0">
                    {u._count.vocabEntries} kata
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Loading() {
  return (
    <div className="py-6 grid lg:grid-cols-[220px_1fr] gap-10 max-w-6xl">
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-hairline/60 animate-pulse" />
        ))}
      </div>
      <div className="space-y-6">
        <div className="h-10 w-48 rounded bg-hairline/60 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OverviewContent />
    </Suspense>
  );
}