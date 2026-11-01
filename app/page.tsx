"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthButton from "@/components/AuthButton";

const FEATURES = [
  { n: "01", title: "Instant Translation", desc: "Context-aware English → Indonesian in under two seconds, powered by your own AI provider." },
  { n: "02", title: "Auto-Vocab Detection", desc: "Intermediate-level words are surfaced, defined and filed without breaking your reading flow." },
  { n: "03", title: "Personal Repository", desc: "Every word kept with its original sentence, ready for spaced review on any device." },
];

const LANGUAGES = ["English", "Bahasa Indonesia", "Español", "Français", "日本語", "Deutsch", "한국어", "Italiano", "Português", "العربية"];

const CHIPS = [
  { text: "Hello!", bg: "#DCE3C3" },
  { text: "こんにちは", bg: "#E8CE72" },
  { text: "¡Hola!", bg: "#DA9B87" },
  { text: "Merci!", bg: "#A9C0DE" },
  { text: "Hallo", bg: "#E4B5AE" },
  { text: "Ciao", bg: "#C9D3AC" },
];

function LoginCTA() {
  const params = useSearchParams();
  return <AuthButton callback={params.get("callback") || undefined} />;
}

function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="currentColor" />
    </svg>
  );
}

function PreviewCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <p className="eyebrow mb-3">Live preview</p>
      <p className="text-sm leading-relaxed text-ink">
        Her answer was <mark className="chip-vocab">eloquent</mark> that the room fell silent.
      </p>
      <div className="rule-gold !my-3" />
      <p className="text-sm leading-relaxed text-ink font-display italic">
        Jawabannya begitu fasih hingga seluruh ruangan terdiam.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
        <span className="text-[.65rem] text-ink-faint">2 words saved to your shelf</span>
      </div>
    </div>
  );
}

function HeroArt() {
  return (
    <>
      <div className="relative md:hidden mt-10 rise" aria-hidden>
        <div className="absolute inset-0 grid-paper rounded-[28px]" />
        <div className="relative z-10 px-3 pt-6 pb-6">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {CHIPS.map((c, i) => (
              <span
                key={c.text}
                className="bubble !relative !text-sm"
                style={{ background: c.bg, animationDelay: `${i * 0.22}s` }}
              >
                {c.text}
              </span>
            ))}
          </div>
          <PreviewCard className="relative mx-auto w-full max-w-[20rem] -rotate-2" />
        </div>
        <Sparkle className="absolute top-4 right-5 h-4 w-4 text-gold" />
        <Sparkle className="absolute bottom-5 left-5 h-3 w-3 text-terracotta" />
        <Sparkle className="absolute top-1/2 left-2 h-2.5 w-2.5 text-sky" />
      </div>

      <div className="relative h-[420px] hidden md:block" aria-hidden>
        <div className="absolute inset-4 grid-paper rounded-[32px]" />

        <div className="bubble text-lg" style={{ top: "4%", left: "2%", background: "#DCE3C3", animationDelay: "0s" }}>Hello!</div>
        <div className="bubble text-lg" style={{ top: "2%", right: "6%", background: "#E8CE72", animationDelay: ".6s" }}>こんにちは</div>
        <div className="bubble text-lg" style={{ top: "40%", left: "-2%", background: "#DA9B87", animationDelay: "1.2s" }}>¡Hola!</div>
        <div className="bubble text-lg" style={{ top: "58%", right: "-2%", background: "#A9C0DE", animationDelay: ".9s" }}>Merci!</div>
        <div className="bubble text-base" style={{ bottom: "4%", left: "16%", background: "#E4B5AE", animationDelay: "1.5s" }}>Hallo</div>
        <div className="bubble text-base" style={{ bottom: "9%", right: "14%", background: "#C9D3AC", animationDelay: ".3s" }}>Ciao</div>

        <Sparkle className="absolute top-[26%] right-[30%] h-5 w-5 text-gold" />
        <Sparkle className="absolute bottom-[26%] left-[8%] h-3.5 w-3.5 text-terracotta" />
        <Sparkle className="absolute top-[12%] left-[42%] h-3 w-3 text-sky" />

        <svg className="absolute bottom-[30%] right-[2%] h-5 w-5 text-terracotta" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.6-9.5-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 6c-2 4.4-9.5 9-9.5 9Z" />
        </svg>

        <PreviewCard className="absolute left-1/2 top-1/2 w-[17rem] -translate-x-1/2 -translate-y-1/2 -rotate-2" />
      </div>
    </>
  );
}

export default function Home() {
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  return (
    <section className="pb-12 md:pb-20">
      <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-10 lg:gap-8 items-center pt-4 md:pt-12">
        <div className="rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper/70 px-3 py-1.5 text-xs text-ink-muted mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            Learn natural, bite-sized lessons
          </span>

          <h1 className="display text-[clamp(2.6rem,8.4vw,6.4rem)] leading-[.92] tracking-tight">
            Master<br />
            new languages,<br />
            <span className="italic text-gold">effortlessly.</span>
          </h1>

          <p className="mt-6 md:mt-7 text-base md:text-lg text-ink-muted leading-relaxed max-w-md">
            Learn to speak with confidence. Translate real sentences, and let the AI quietly archive the words worth remembering.
          </p>

          <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3 md:gap-4">
            <Suspense fallback={<div className="h-12 w-52 animate-pulse rounded-full bg-hairline" />}>
              <LoginCTA />
            </Suspense>
            <a href="#how" className="text-sm text-ink-muted hover:text-ink transition-colors underline decoration-hairline underline-offset-4 hover:decoration-gold">
              How it works
            </a>
          </div>

          <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-faint">
            <span>Free to start</span>
            <span className="h-3 w-px bg-hairline" />
            <span>Google sign-in</span>
            <span className="h-3 w-px bg-hairline" />
            <span>Your own AI provider</span>
          </div>
        </div>

        <HeroArt />
      </div>

      <div className="mt-12 md:mt-16 border-y border-hairline overflow-hidden py-4">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {LANGUAGES.map((lang) => (
                <span key={`${dup}-${lang}`} className="flex items-center gap-6 px-6 text-sm text-ink-muted whitespace-nowrap">
                  <span className="font-display italic">{lang}</span>
                  <span className="text-gold">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div id="how" className="rule-gold" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {FEATURES.map((f, idx) => (
          <article
            key={f.n}
            className={`card rise p-7 md:p-8 overflow-hidden ${idx === 1 ? "md:-translate-y-4" : ""}`}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <span className="absolute -right-3 -top-5 font-display text-6xl text-gold-soft/60 select-none">{f.n}</span>
            <p className="eyebrow mb-4 relative">{f.n === "01" ? "Translate" : f.n === "02" ? "Detect" : "Remember"}</p>
            <h3 className="display text-xl md:text-2xl mb-3 relative">{f.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted relative">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}