import { Suspense } from "react";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminRestricted from "@/components/admin/AdminRestricted";

export const metadata = { title: "Users — Admin" };

async function UsersContent() {
  const { session, admin } = await getAdminSession();
  if (!session?.user) return <AdminRestricted signedIn={false} />;
  if (admin?.role !== "ADMIN") return <AdminRestricted signedIn={true} />;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      role: true,
      onboardedAt: true,
      createdAt: true,
      _count: { select: { vocabEntries: true } },
    },
  });

  return (
    <AdminShell
      eyebrow="Directory"
      title="Users"
      description={`${users.length} akun terdaftar. Data langsung dari Postgres.`}
    >
      <section className="card overflow-hidden">
        {users.length === 0 ? (
          <p className="p-8 text-sm text-ink-faint italic font-display text-center">Belum ada user terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[44rem]">
              <thead className="bg-cream/60">
                <tr className="text-left text-ink-faint">
                  <th className="px-5 py-3 eyebrow font-semibold">User</th>
                  <th className="px-5 py-3 eyebrow font-semibold">Username</th>
                  <th className="px-5 py-3 eyebrow font-semibold">Role</th>
                  <th className="px-5 py-3 eyebrow font-semibold text-right">Words</th>
                  <th className="px-5 py-3 eyebrow font-semibold text-right">Status</th>
                  <th className="px-5 py-3 eyebrow font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-hairline hover:bg-cream/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-ink">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                      </span>
                      <span className="block text-xs text-ink-faint">{u.email}</span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{u.username ? `@${u.username}` : "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-ink text-ivory" : "bg-hairline text-ink-muted"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink-muted">{u._count.vocabEntries}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${u.onboardedAt ? "bg-gold-soft text-ink" : "bg-hairline text-ink-faint"}`}>
                        {u.onboardedAt ? "Onboarded" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-faint tabular-nums">
                      {u.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="py-10 h-10 w-56 rounded bg-hairline/60 animate-pulse" />}>
      <UsersContent />
    </Suspense>
  );
}