import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { translateAndExtract, AiNotConfiguredError } from "@/lib/ai";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(session.user.id, "translate", 30);
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  try {
    const { sentence } = await req.json();
    if (!sentence || typeof sentence !== "string" || !sentence.trim()) {
      return NextResponse.json({ error: "Sentence is required" }, { status: 400 });
    }
    if (sentence.length > 5000) {
      return NextResponse.json({ error: "Sentence too long (max 5000 chars)" }, { status: 400 });
    }

    const result = await translateAndExtract(sentence.trim());
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Translation error:", err);
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: "AI sedang maintenance. Coba lagi sebentar ya." }, { status: 503 });
    }
    return NextResponse.json({ error: "AI sedang maintenance. Coba lagi sebentar ya." }, { status: 500 });
  }
}