"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllVocab, setVocabStatus, removeVocab } from "@/app/actions/vocab";
import type { VocabEntry } from "@/lib/vocab-types";

type Sort = "newest" | "alpha";

export default function VocabularyPage() {
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<VocabEntry | null>(null);
  const [tab, setTab] = useState<"learning" | "mastered">("learning");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function refresh() {
    setEntries(await getAllVocab());
    setLoaded(true);
  }

  useEffect(() => { refresh(); }, []);

  const learningCount = entries.filter((e) => e.status === "learning").length;
  const masteredCount = entries.filter((e) => e.status === "mastered").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => e.status === tab)
      .filter((e) => !q || e.word.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q))
      .sort((a, b) => (sort === "alpha" ? a.word.localeCompare(b.word) : b.addedAt - a.addedAt));
  }, [entries, tab, query, sort]);

  async function markMastered(word: string) {
    await setVocabStatus(word, "mastered");
    await refresh();
    setSelected(null);
  }

  async function requestDelete(word: string) {
    if (confirmDelete === word) {
      await removeVocab(word);
      await refresh();
      setSelected(null);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(word);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-8">
      <header className="space-y-3">
        <p className="eyebrow">Repository</p>
        <h1 className="display text-4xl md:text-6xl leading-[.95]">
          My <span className="italic text-gold">Vocabulary</span>
        </h1>
        <p className="text-ink-muted max-w-lg">Every word the AI flagged, kept with its original context.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="eyebrow">Learning</p>
          <p className="display text-2xl mt-1 tabular-nums">{learningCount}</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow">Mastered</p>
          <p className="display text-2xl mt-1 tabular-nums">{masteredCount}</p>
        </div>
        <div className="card p-4 hidden sm:block">
          <p className="eyebrow">Total</p>
          <p className="display text-2xl mt-1 tabular-nums">{entries.length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex gap-6 border-b border-hairline order-2 sm:order-1">
          {(["learning", "mastered"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 -mb-px text-sm font-medium capitalize transition-colors ${
                tab === t ? "text-ink border-b-2 border-gold" : "text-ink-faint hover:text-ink-muted border-b-2 border-transparent"
              }`}
            >
              {t} <span className="ml-1 text-ink-faint tabular-nums">{t === "learning" ? learningCount : masteredCount}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 order-1 sm:order-2">
          <div className="relative flex-1 sm:flex-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words…"
              className="w-full sm:w-52 border border-hairline rounded-full pl-8 pr-3 py-2 text-sm bg-paper text-ink outline-none focus:border-gold transition-colors"
            />
          </div>
          <button
            onClick={() => setSort(sort === "newest" ? "alpha" : "newest")}
            className="text-xs px-3 py-2 rounded-full border border-hairline text-ink-muted hover:border-gold hover:text-ink transition-colors whitespace-nowrap"
          >
            {sort === "newest" ? "Newest" : "A–Z"}
          </button>
        </div>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold-soft/50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-gold-deep">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>
          <p className="text-ink-faint italic font-display">
            {query ? "Tidak ada kata yang cocok." : "Belum ada kata — terjemahkan satu kalimat untuk mengisi rak ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((e, i) => (
              <motion.button
                key={e.word}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.3 }}
                onClick={() => { setSelected(e); setConfirmDelete(null); }}
                className="card p-5 text-left group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="display text-xl text-ink group-hover:text-gold transition-colors">{e.word}</span>
                  <span className={`h-2 w-2 rounded-full mt-2 shrink-0 ${e.status === "mastered" ? "bg-green-600" : "bg-gold"}`} />
                </div>
                {e.pronunciation && <span className="block text-xs text-gold italic font-display mt-0.5">{e.pronunciation}</span>}
                <span className="block text-sm text-ink-muted mt-2 line-clamp-2 leading-relaxed">{e.definition}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
            onClick={() => { setSelected(null); setConfirmDelete(null); }}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vocab-dialog-title"
              onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }}
              className="card p-7 md:p-8 max-w-lg w-full space-y-5 bg-paper max-h-[90vh] overflow-y-auto"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 id="vocab-dialog-title" className="display text-3xl text-ink">{selected.word}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selected.pronunciation && <p className="text-sm text-gold italic font-display">{selected.pronunciation}</p>}
                    <span className={`text-[.6rem] px-2 py-0.5 rounded-full ${selected.status === "mastered" ? "bg-green-100 text-green-800" : "bg-gold-soft text-ink"}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
                <button autoFocus onClick={() => setSelected(null)} aria-label="Close" className="text-ink-faint hover:text-ink text-2xl leading-none -mt-1">×</button>
              </div>

              <p className="text-base text-ink leading-relaxed">{selected.definition}</p>

              <div className="rule-gold !my-2" />

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="eyebrow mb-1.5">In context</dt>
                  <dd className="text-ink-muted leading-relaxed">{selected.context}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-1.5">Translation</dt>
                  <dd className="text-ink-muted leading-relaxed italic font-display">{selected.translation}</dd>
                </div>
              </dl>

              <div className="flex gap-3 pt-2">
                {selected.status === "learning" && (
                  <button onClick={() => markMastered(selected.word)} className="btn btn-primary flex-1">
                    Mark mastered
                  </button>
                )}
                <button
                  onClick={() => requestDelete(selected.word)}
                  onBlur={() => setConfirmDelete(null)}
                  className="btn btn-ghost text-red-600 border-red-200 hover:border-red-400 hover:text-red-700"
                >
                  {confirmDelete === selected.word ? "Tap again to confirm" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}