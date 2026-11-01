"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const MODES = [
  {
    href: "/dashboard",
    title: "Instant Translate",
    desc: "Paste a sentence, get context-aware Indonesian and auto-saved vocabulary.",
    tag: "Core",
    icon: (
      <>
        <path d="M4 5h9M8.5 5v2c0 3.5-2 6-4.5 7.5" />
        <path d="M6 11c1.5 2 3 3.2 5 4" />
        <path d="M13 19l4-9 4 9M14.5 16h5" />
      </>
    ),
  },
  {
    href: "/vocabulary",
    title: "Vocabulary Shelf",
    desc: "Browse every word the AI archived, review context, mark what you've mastered.",
    tag: "Review",
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
  },
  {
    title: "Spaced Review",
    desc: "Flashcard drill with Leitner scheduling to move words into long-term memory.",
    tag: "Soon",
    icon: (
      <>
        <rect x="3" y="6" width="14" height="14" rx="2" />
        <path d="M7 3h12a2 2 0 0 1 2 2v12" />
      </>
    ),
  },
  {
    title: "Listening Drill",
    desc: "Hear the sentence read aloud, catch the difficult words by ear.",
    tag: "Soon",
    icon: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="3" y="14" width="4" height="6" rx="1.5" />
        <rect x="17" y="14" width="4" height="6" rx="1.5" />
      </>
    ),
  },
  {
    title: "Writing Prompt",
    desc: "Compose in English, let the AI correct your grammar and extract new words.",
    tag: "Soon",
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  },
  {
    href: "/partner",
    title: "AI Partner",
    desc: "Chat one-on-one with Maya — natural English replies and gentle corrections in real time.",
    tag: "New",
    icon: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.4-.7L3 21l1.8-5.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
        <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
      </>
    ),
  },
];

export default function PracticePage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (!session?.user) {
          router.replace("/");
          return;
        }
        setName(session.user.firstName || session.user.name?.split(" ")[0] || "there");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="py-14 space-y-6">
        <div className="h-12 w-64 animate-pulse rounded bg-hairline" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-7 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 md:py-12 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Welcome back</p>
          <h1 className="display text-4xl md:text-6xl leading-[.95]">
            Hey, <span className="italic text-gold">{name}.</span><br />
            How do you want to train today?
          </h1>
        </div>
        <Link href="/vocabulary" className="btn btn-ghost text-sm hidden sm:inline-flex">
          Open vocabulary →
        </Link>
      </header>

      <div className="rule-gold !my-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {MODES.map((m, i) => {
          const soon = m.tag === "Soon";
          const inner = (
            <>
              <div className="flex items-start justify-between mb-5">
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${soon ? "bg-hairline/70 text-ink-faint" : "bg-gold-soft/60 text-gold-deep"}`}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {m.icon}
                  </svg>
                </span>
                <span className={`text-[.6rem] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${soon ? "bg-hairline text-ink-faint" : "bg-ink text-ivory"}`}>
                  {m.tag}
                </span>
              </div>
              <h2 className="display text-xl md:text-2xl mb-2">{m.title}</h2>
              <p className="text-sm text-ink-muted leading-relaxed">{m.desc}</p>
              {!soon && (
                <span className="mt-5 inline-flex items-center gap-1 text-sm text-gold font-medium">
                  Enter <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              )}
            </>
          );

          if (soon) {
            return (
              <div key={i} className="card p-6 md:p-7 opacity-60 cursor-not-allowed select-none">{inner}</div>
            );
          }
          return (
            <Link key={i} href={m.href ?? "/practice"} className="card p-6 md:p-7 block group">
              {inner}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}