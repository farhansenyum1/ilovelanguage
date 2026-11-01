"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { TranslationResult, VocabWord } from "@/lib/ai-types";
import { addVocabBatch } from "@/app/actions/vocab";

const EXAMPLES = [
  "Her answer was so eloquent that the entire room fell silent.",
  "The government's decision remains highly controversial among voters.",
  "He tends to procrastinate whenever the task feels overwhelming.",
  "Their meticulous planning averted what could have been a disaster.",
];

function HighlightedSentence({ sentence, words }: { sentence: string; words: VocabWord[] }) {
  if (!words.length) return <>{sentence}</>;
  const escaped = words.map((w) => w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = sentence.split(re);
  const lowerSet = new Set(words.map((w) => w.word.toLowerCase()));
  return (
    <>
      {parts.map((part, i) =>
        lowerSet.has(part.toLowerCase()) ? (
          <mark key={i} className="chip-vocab" title="Kata sulit — tersimpan otomatis">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink transition-colors"
      aria-label="Copy translation"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function TranslationBox() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  async function handleTranslate() {
    const sentence = input.trim();
    if (!sentence || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedCount(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const parsed = data as TranslationResult;
      setResult(parsed);
      if (parsed.difficultWords?.length) {
        const saved = await addVocabBatch(
          parsed.difficultWords.map((w) => ({
            word: w.word,
            definition: w.definition,
            pronunciation: w.pronunciation,
            context: sentence,
            translation: parsed.translation,
          }))
        );
        setSavedCount(saved.length);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI sedang maintenance. Coba lagi sebentar ya.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setInput("");
    setResult(null);
    setError(null);
    setSavedCount(null);
  }

  const canSubmit = input.trim().length > 0 && !loading;

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow">English</span>
          <span className="text-[.7rem] tabular-nums text-ink-faint">{input.length} / 5000</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleTranslate();
          }}
          placeholder="Paste or type an English sentence…"
          rows={4}
          maxLength={5000}
          className="w-full resize-none bg-transparent outline-none text-lg md:text-xl leading-relaxed text-ink placeholder:text-ink-faint/80 min-h-[7rem]"
        />

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[.7rem] text-ink-faint mr-1">Try:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInput(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-hairline text-ink-muted hover:border-gold hover:text-ink transition-colors"
            >
              {ex.split(" ").slice(0, 3).join(" ")}…
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-hairline">
          <p className="text-xs text-ink-faint hidden sm:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-hairline bg-cream text-[.65rem]">⌘</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border border-hairline bg-cream text-[.65rem]">↵</kbd>
            <span className="ml-1">to translate</span>
          </p>
          <div className="flex items-center gap-2 ml-auto">
            {(input || result) && (
              <button onClick={reset} className="text-xs text-ink-faint hover:text-ink transition-colors px-2">
                Clear
              </button>
            )}
            <button
              onClick={handleTranslate}
              disabled={!canSubmit}
              className="btn btn-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-ivory/40 border-t-ivory animate-spin" />
                  Translating…
                </>
              ) : (
                <>Translate →</>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="sk"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <p className="sr-only" role="status">Translating…</p>
            {[0, 1].map((i) => (
              <div key={i} className="card p-6 space-y-3">
                <div className="h-2.5 w-24 bg-gold-soft/60 animate-pulse rounded" />
                <div className="h-3 w-full bg-gold-soft/40 animate-pulse rounded" />
                <div className="h-3 w-4/5 bg-gold-soft/40 animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-gold-soft/40 animate-pulse rounded" />
              </div>
            ))}
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="er"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 border-red-200 bg-red-50/50 text-red-700 text-sm flex items-start gap-2.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="rs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <article className="card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Source · English</p>
                  <span className="text-[.65rem] px-2 py-0.5 rounded-full bg-cream text-ink-faint">EN</span>
                </div>
                <p className="text-base md:text-lg leading-relaxed text-ink">
                  <HighlightedSentence sentence={input.trim()} words={result.difficultWords} />
                </p>
              </article>

              <article className="card p-6 space-y-3 border-l-[3px] border-l-gold relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Target · Indonesia</p>
                  <span className="text-[.65rem] px-2 py-0.5 rounded-full bg-gold-soft text-ink">ID</span>
                </div>
                <p className="text-base md:text-lg leading-relaxed text-ink font-display italic">
                  {result.translation}
                </p>
                <div className="pt-1">
                  <CopyButton text={result.translation} />
                </div>
              </article>
            </div>

            {result.difficultWords.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="display text-lg">Words worth keeping</h2>
                  <span className="text-xs text-ink-faint">
                    {savedCount && savedCount > 0 ? `${savedCount} baru disimpan` : "sudah ada di koleksi"}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.difficultWords.map((w, i) => (
                    <motion.div
                      key={w.word + i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.35 }}
                      className="card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="display text-lg text-ink">{w.word}</h3>
                        <span className="text-[.6rem] px-1.5 py-0.5 rounded bg-gold-soft/70 text-ink shrink-0">
                          saved
                        </span>
                      </div>
                      {w.pronunciation && (
                        <p className="text-xs text-gold italic font-display mt-0.5">{w.pronunciation}</p>
                      )}
                      <p className="text-sm text-ink-muted leading-relaxed mt-2">{w.definition}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center pt-1">
                  <Link
                    href="/vocabulary"
                    className="text-sm text-ink underline decoration-gold underline-offset-4 hover:text-gold transition-colors"
                  >
                    Buka koleksi kosakata →
                  </Link>
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}