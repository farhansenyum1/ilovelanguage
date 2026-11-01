import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { translateBubble, AiNotConfiguredError } from "@/lib/ai";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(session.user.id, "bubble-translate", 60);
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "Teks kosong." }, { status: 400 });
  if (text.length > 4000) {
    return NextResponse.json({ error: "Teks terlalu panjang." }, { status: 400 });
  }

  try {
    const translation = await translateBubble(text);
    return NextResponse.json({ translation });
  } catch (err: unknown) {
    console.error("Bubble translate error:", err);
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: "AI sedang maintenance. Coba lagi sebentar ya." }, { status: 503 });
    }
    return NextResponse.json({ error: "AI sedang maintenance. Coba lagi sebentar ya." }, { status: 500 });
  }
}