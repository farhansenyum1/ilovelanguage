import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import PartnerChat from "@/components/partner/PartnerChat";

export const metadata = { title: "AI Partner — iLoveLanguage" };

async function PartnerContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const conversation = await db.conversation.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 40 },
    },
  });

  const initialMessages =
    conversation?.messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })) ?? [];

  return (
    <div className="max-w-5xl mx-auto py-3 md:py-10">
      <header className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
        <div className="space-y-1.5 md:space-y-2">
          <p className="eyebrow">The conversation salon</p>
          <h1 className="display text-3xl sm:text-4xl md:text-5xl">
            Practice with <span className="italic text-gold">Maya</span>
          </h1>
          <p className="hidden sm:block text-ink-muted max-w-lg text-sm md:text-base">
            A pen pal who talks about real life, replies in your chosen language, and drops gentle tips
            along the way.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[.7rem] text-ink-muted shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-gold-soft/50 border border-gold-soft text-gold-deep font-semibold">
            8 languages
          </span>
          <span className="px-2.5 py-1 rounded-full bg-paper border border-hairline">everyday talk only</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[272px_minmax(0,1fr)] gap-4 md:gap-6 items-start">
        <aside className="hidden lg:flex flex-col gap-4 sticky top-24">
          <div className="rounded-2xl border border-hairline bg-paper/70 p-5 shadow-[var(--shadow-warm)]">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full p-[2px] bg-[conic-gradient(from_140deg,#E8D9B5,#B8935A,#8F6D3C,#E8D9B5)]">
                <div className="h-full w-full rounded-full bg-ivory flex items-center justify-center font-display text-xl text-ink">
                  M
                </div>
              </div>
              <div>
                <p className="display text-2xl leading-none">Maya</p>
                <p className="text-xs text-ink-faint mt-1.5">Pen pal · London</p>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed mt-4">
              Flat whites, bad puns, and hearing about your day. She keeps things light and human — never
              a textbook.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {["Everyday talk", "Gentle tips", "No lectures"].map((t) => (
                <span
                  key={t}
                  className="text-[.65rem] px-2 py-0.5 rounded-full border border-hairline bg-cream text-ink-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-paper/70 p-5">
            <p className="eyebrow mb-3">House rules</p>
            <ol className="space-y-3 text-sm text-ink-muted">
              {[
                "Keep it everyday — food, plans, music, little stories.",
                "She won't help with code or tech stuff.",
                "Switch language anytime from the header.",
              ].map((rule, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display italic text-gold-deep leading-none text-base">
                    0{i + 1}
                  </span>
                  <span className="leading-snug">{rule}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-gold-soft bg-gold-soft/25 p-5">
            <span className="font-display text-3xl text-gold-deep leading-none">&ldquo;</span>
            <p className="font-display italic text-lg text-ink leading-snug -mt-1">
              Tell me the little things — that&apos;s where the good stories live.
            </p>
            <p className="text-[.68rem] uppercase tracking-[.16em] text-gold-deep/80 mt-3">Maya&apos;s motto</p>
          </div>
        </aside>

        <PartnerChat
          initialConversationId={conversation?.id ?? null}
          initialMessages={initialMessages}
          initialLanguage={conversation?.language ?? "en"}
        />
      </div>
    </div>
  );
}

export default function PartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto py-10">
          <div className="h-10 w-64 rounded bg-hairline/60 animate-pulse mb-8" />
          <div className="grid lg:grid-cols-[272px_minmax(0,1fr)] gap-6">
            <div className="hidden lg:block space-y-4">
              <div className="h-44 rounded-2xl bg-hairline/40 animate-pulse" />
              <div className="h-36 rounded-2xl bg-hairline/40 animate-pulse" />
            </div>
            <div className="h-[34rem] rounded-[26px] bg-hairline/40 animate-pulse" />
          </div>
        </div>
      }
    >
      <PartnerContent />
    </Suspense>
  );
}