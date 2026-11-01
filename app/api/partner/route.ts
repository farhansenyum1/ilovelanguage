import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { partnerReply, AiNotConfiguredError, isOffTopic, refusalFor, correctMessage } from "@/lib/ai";
import { isLanguageCode, detectRequestedLanguage } from "@/lib/languages";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = await rateLimit(userId, "partner", 20);
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let body: { conversationId?: string; message?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });
  if (message.length > 2000) {
    return NextResponse.json({ error: "Pesan terlalu panjang (maks 2000 karakter)." }, { status: 400 });
  }

  const requested = detectRequestedLanguage(message);
  const language =
    requested ?? (body.language && isLanguageCode(body.language) ? body.language : "en");

  let conversationId = body.conversationId;
  if (conversationId) {
    const owned = await db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true, language: true },
    });
    if (!owned) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
    if (owned.language !== language) {
      await db.conversation.update({ where: { id: conversationId }, data: { language } });
    }
  } else {
    const conv = await db.conversation.create({
      data: { userId, language },
      select: { id: true },
    });
    conversationId = conv.id;
  }

  const userRow = await db.message.create({
    data: { conversationId, role: "user", content: message },
  });

  async function saveReply(reply: string, shownMessage = message) {
    await db.message.create({ data: { conversationId: conversationId!, role: "assistant", content: reply } });
    await db.conversation.update({ where: { id: conversationId! }, data: { updatedAt: new Date() } });
    return NextResponse.json({ conversationId, reply, language, message: shownMessage });
  }

  if (isOffTopic(message)) {
    return saveReply(refusalFor(language));
  }

  const rows = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: { role: true, content: true },
  });

  const history = rows.map((r) => ({
    role: r.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: r.content,
  }));

  try {
    const [corrected, reply] = await Promise.all([
      correctMessage(message).catch(() => message),
      partnerReply(history, language),
    ]);
    if (corrected && corrected !== message) {
      await db.message.update({ where: { id: userRow.id }, data: { content: corrected } });
    }
    return saveReply(reply, corrected);
  } catch (err: unknown) {
    console.error("Partner error:", err);
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI sedang maintenance. Coba lagi sebentar ya." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "AI sedang maintenance. Coba lagi sebentar ya." }, { status: 500 });
  }
}