import { Suspense } from "react";
import { getAiSettings } from "@/lib/ai";
import { getAdminSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminRestricted from "@/components/admin/AdminRestricted";
import AiSettingsForm from "@/components/admin/AiSettingsForm";

export const metadata = { title: "AI Integration — Admin" };

async function AiContent() {
  const { session, admin } = await getAdminSession();
  if (!session?.user) return <AdminRestricted signedIn={false} />;
  if (admin?.role !== "ADMIN") return <AdminRestricted signedIn={true} />;

  const cfg = await getAiSettings();

  return (
    <AdminShell
      eyebrow="Integrations"
      title="AI Integration"
      description="Hubungkan provider AI third-party. Semua kunci disimpan aman di database."
    >
      <AiSettingsForm
        initial={
          cfg
            ? {
                provider: cfg.provider,
                baseUrl: cfg.baseUrl,
                model: cfg.model,
                enabled: cfg.enabled,
                hasKey: !!cfg.apiKey,
                updatedAt: cfg.updatedAt.toISOString(),
              }
            : null
        }
      />
    </AdminShell>
  );
}

export default function AdminAiPage() {
  return (
    <Suspense fallback={<div className="py-10 h-10 w-56 rounded bg-hairline/60 animate-pulse" />}>
      <AiContent />
    </Suspense>
  );
}