import { db } from "@/lib/db";

export type RateLimitResult = { ok: boolean; retryAfter: number };

export async function rateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  try {
    const row = await db.rateLimit.upsert({
      where: { userId_action_windowStart: { userId, action, windowStart } },
      create: { userId, action, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    return {
      ok: row.count <= limit,
      retryAfter: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000)),
    };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return { ok: true, retryAfter: 0 };
  }
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi sebentar ya." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    }
  );
}