"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function saveAiSettings(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const provider = String(formData.get("provider") || "").trim() || "OpenRouter";
  const baseUrl = String(formData.get("baseUrl") || "").trim().replace(/\/+$/, "");
  const model = String(formData.get("model") || "").trim();
  const apiKeyInput = String(formData.get("apiKey") || "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!/^https?:\/\//.test(baseUrl)) {
    return { error: "Base URL harus diawali http:// atau https://" };
  }
  if (!model) return { error: "Model wajib diisi." };

  const existing = await db.aiSetting.findUnique({ where: { id: "default" } });
  const apiKey = apiKeyInput || existing?.apiKey || "";
  if (!apiKey) return { error: "API key wajib diisi untuk pertama kali." };

  await db.aiSetting.upsert({
    where: { id: "default" },
    create: { id: "default", provider, baseUrl, model, apiKey, enabled },
    update: { provider, baseUrl, model, apiKey, enabled },
  });

  revalidatePath("/admin-portal/ai");
  return { ok: true };
}

export async function testAiConnection() {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const cfg = await db.aiSetting.findUnique({ where: { id: "default" } });
  if (!cfg?.apiKey) return { error: "Belum ada API key tersimpan." };

  const base = cfg.baseUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 8,
        temperature: 0,
        messages: [{ role: "user", content: "Reply with OK only." }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `HTTP ${res.status}: ${body.slice(0, 180)}` };
    }
    return { ok: true, message: "Koneksi berhasil." };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Gagal terhubung." };
  }
}