"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES, getLanguage } from "@/lib/languages";

type Msg = { role: "user" | "assistant"; content: string };
type Tr = { text?: string; loading?: boolean; error?: string; open: boolean };

type SpeechItem = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechItem> };
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type SpeechCtor = new () => SpeechRec;
type SpeechWindow = {
  SpeechRecognition?: SpeechCtor;
  webkitSpeechRecognition?: SpeechCtor;
};

function AssistantText({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const body = lines.filter((l) => !/^tip:/i.test(l));
  const tips = lines.filter((l) => /^tip:/i.test(l));
  return (
    <div className="space-y-2">
      {body.map((l, i) => (
        <p key={i} className="leading-relaxed">{l}</p>
      ))}
      {tips.map((t, i) => (
        <div
          key={`tip-${i}`}
          className="flex gap-2 items-start text-xs bg-gold-soft/40 border border-gold-soft rounded-xl px-3 py-2 text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-gold-deep mt-0.5 shrink-0">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
          </svg>
          <span>
            <span className="font-semibold text-gold-deep">Tip: </span>
            {t.replace(/^tip:\s*/i, "")}
          </span>
        </div>
      ))}
    </div>
  );
}

function MayaAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7 text-sm" : size === "lg" ? "h-14 w-14 text-2xl" : "h-10 w-10 text-lg";
  return (
    <span
      className={`${dims} shrink-0 rounded-full bg-[linear-gradient(145deg,#F3E4C6,#D8B87E_55%,#B8935A)] text-ink flex items-center justify-center font-display ring-1 ring-ink/10 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]`}
      aria-hidden
    >
      M
    </span>
  );
}

export default function PartnerChat({
  initialConversationId,
  initialMessages,
  initialLanguage,
}: {
  initialConversationId: string | null;
  initialMessages: Msg[];
  initialLanguage: string;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [language, setLanguage] = useState(initialLanguage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<number, Tr>>({});
  const [listening, setListening] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const baseTextRef = useRef("");
  const finalTextRef = useRef("");
  const silenceTimerRef = useRef<number | null>(null);
  const SILENCE_MS = 3000;

  const lang = getLanguage(language);
  const starters = lang.starters;
  const quickReplies = lang.quickReplies;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    const w = window as unknown as SpeechWindow;
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      recRef.current?.abort();
      if (silenceTimerRef.current !== null) window.clearTimeout(silenceTimerRef.current);
    };
  }, []);

  function clearSilenceTimer() {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function armSilenceTimer() {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      silenceTimerRef.current = null;
      recRef.current?.stop();
    }, SILENCE_MS);
  }

  function grow() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  function stopMic() {
    recRef.current?.stop();
  }

  async function autoFix(text: string) {
    const clean = text.trim();
    if (clean.length < 4) return;
    setFixing(true);
    try {
      const res = await fetch("/api/partner/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json();
      if (res.ok && typeof data.text === "string" && data.text.trim()) {
        setInput((cur) => (cur.trim() === clean ? data.text.trim() : cur));
        requestAnimationFrame(grow);
      }
    } catch {
      // Keep the transcript if correction is unavailable.
    } finally {
      setFixing(false);
    }
  }

  function startMic() {
    if (listening) {
      stopMic();
      return;
    }
    setMicError(null);
    const w = window as unknown as SpeechWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setMicError("Browser ini belum mendukung input suara.");
      return;
    }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang.locale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    baseTextRef.current = input.trim() ? `${input.trim()} ` : "";
    finalTextRef.current = "";

    rec.onstart = () => {
      setListening(true);
      armSilenceTimer();
    };
    rec.onresult = (e) => {
      armSilenceTimer();
      let interim = "";
      for (let j = e.resultIndex; j < e.results.length; j++) {
        const item = e.results[j];
        if (item.isFinal) finalTextRef.current += item[0].transcript;
        else interim += item[0].transcript;
      }
      const next = `${baseTextRef.current}${finalTextRef.current}${interim}`.replace(/\s+/g, " ");
      setInput(next);
      grow();
    };
    rec.onerror = (e) => {
      clearSilenceTimer();
      setListening(false);
      const msg =
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Izin mikrofon ditolak. Aktifkan di pengaturan browser."
          : e.error === "no-speech"
            ? "Tidak ada suara terdeteksi. Coba lagi."
            : e.error === "network"
              ? "Koneksi bermasalah saat mendengarkan."
              : "Input suara gagal. Coba lagi.";
      setMicError(msg);
    };
    rec.onend = () => {
      clearSilenceTimer();
      setListening(false);
      recRef.current = null;
      const finalText = `${baseTextRef.current}${finalTextRef.current}`.replace(/\s+/g, " ").trim();
      setInput(finalText);
      requestAnimationFrame(grow);
      inputRef.current?.focus();
      if (finalText) autoFix(finalText);
    };

    try {
      rec.start();
    } catch {
      setMicError("Input suara gagal dimulai. Coba lagi.");
      recRef.current = null;
    }
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    if (listening) stopMic();
    setError(null);
    setMicError(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim pesan.");
      setConversationId(data.conversationId);
      if (data.language) setLanguage(data.language);
      setMessages((m) => {
        const next = [...m];
        if (data.message && data.message !== message) {
          for (let j = next.length - 1; j >= 0; j--) {
            if (next[j].role === "user") {
              next[j] = { ...next[j], content: data.message };
              break;
            }
          }
        }
        next.push({ role: "assistant", content: data.reply });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setMessages((m) => m.slice(0, -1));
      setInput(message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function toggleTranslation(i: number, text: string) {
    const cur = translations[i];
    if (cur?.text) {
      setTranslations((prev) => ({ ...prev, [i]: { ...prev[i], open: !prev[i].open } }));
      return;
    }
    if (cur?.loading) return;

    setTranslations((prev) => ({ ...prev, [i]: { loading: true, open: true } }));
    try {
      const res = await fetch("/api/partner/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menerjemahkan.");
      setTranslations((prev) => ({ ...prev, [i]: { text: data.translation, open: true } }));
    } catch (e) {
      setTranslations((prev) => ({
        ...prev,
        [i]: {
          error: e instanceof Error ? e.message : "AI sedang maintenance. Coba lagi sebentar ya.",
          open: true,
        },
      }));
    }
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setTranslations({});
    setError(null);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative rounded-[22px] sm:rounded-[26px] border border-hairline bg-paper shadow-[var(--shadow-warm)] overflow-hidden flex flex-col h-[calc(100dvh-15rem)] min-h-[24rem] max-h-[54rem] md:h-[calc(100vh-16rem)] md:min-h-[34rem]">
      {/* Header */}
      <div className="relative bg-[linear-gradient(135deg,#0B192C,#16294A_58%,#22375C)] px-4 sm:px-5 py-4 text-ivory">
        <div
          className="pointer-events-none absolute inset-0 opacity-[.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <MayaAvatar />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#122340]" />
            </div>
            <div className="min-w-0">
              <p className="font-display italic text-xl leading-none">Maya</p>
              <p className="text-[.7rem] text-ivory/60 mt-1 truncate">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 align-middle" />
                online<span className="hidden sm:inline"> · replies in seconds</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="partner-language" className="sr-only">
              Conversation language
            </label>
            <select
              id="partner-language"
              value={language}
              onChange={(e) => {
                if (listening) stopMic();
                setLanguage(e.target.value);
                setError(null);
                setMicError(null);
              }}
              className="text-xs max-w-[7rem] sm:max-w-[10rem] bg-ivory/95 text-ink border border-white/20 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-gold cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <button
              onClick={newChat}
              aria-label="Start a new chat"
              className="h-8 w-8 rounded-full border border-white/20 text-ivory/80 hover:bg-white/10 hover:text-ivory transition-colors flex items-center justify-center"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scroll relative flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 sm:py-6 space-y-5 bg-[radial-gradient(120%_85%_at_50%_0%,#FFFDF9_0%,#FAF5EC_70%)]"
      >
        <span className="pointer-events-none select-none absolute -top-3 left-3 font-display text-[8rem] leading-none text-ink/[.035]" aria-hidden>
          &ldquo;
        </span>

        {messages.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 min-h-full flex flex-col items-center justify-center text-center px-2 py-4 sm:py-6"
          >
            <div className="relative mb-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full p-[2px] bg-[conic-gradient(from_140deg,#E8D9B5,#B8935A,#8F6D3C,#E8D9B5)]">
                <div className="h-full w-full rounded-full bg-ivory flex items-center justify-center font-display text-2xl sm:text-3xl text-ink">
                  M
                </div>
              </div>
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-[#FAF5EC]" />
            </div>
            <h2 className="display text-2xl sm:text-4xl text-ink">
              Hey, I&apos;m <span className="italic text-gold-deep">Maya</span>.
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1.5 max-w-sm leading-relaxed">
              Your pen pal for everyday English, now speaking {lang.label}. Pick an opener and let it flow.
            </p>
            <div className="w-full max-w-md mt-4 sm:mt-6 space-y-2">
              {starters.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
                  onClick={() => send(s)}
                  className="group w-full flex items-center justify-between gap-3 text-left text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-hairline bg-paper/80 text-ink-muted hover:border-gold hover:bg-paper hover:text-ink transition-all"
                >
                  <span>{s}</span>
                  <span className="h-6 w-6 shrink-0 rounded-full border border-hairline flex items-center justify-center text-ink-faint group-hover:border-gold group-hover:text-gold-deep group-hover:translate-x-0.5 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const tr = translations[i];
            const isUser = m.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                className={`relative z-10 flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && <MayaAvatar size="sm" />}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[76%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-[0_2px_12px_-8px_rgba(11,25,44,.35)] ${
                      isUser
                        ? "bg-[linear-gradient(145deg,#152943,#0B192C)] text-ivory rounded-br-md"
                        : "bg-paper border border-hairline text-ink rounded-bl-md"
                    }`}
                  >
                    {isUser ? m.content : <AssistantText text={m.content} />}

                    {tr?.open && (
                      <div
                        className={`mt-2.5 pt-2.5 border-t text-sm ${
                          isUser ? "border-white/15" : "border-hairline"
                        }`}
                      >
                        {tr.loading && (
                          <p className="text-xs opacity-60">Translating…</p>
                        )}
                        {tr.error && (
                          <p className={`text-xs ${isUser ? "text-red-200" : "text-red-600"}`}>{tr.error}</p>
                        )}
                        {tr.text && (
                          <>
                            <p className="text-[.58rem] uppercase tracking-[.16em] opacity-50 mb-1">
                              Indonesian
                            </p>
                            <p className="leading-relaxed">{tr.text}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleTranslation(i, m.content)}
                    disabled={tr?.loading}
                    aria-expanded={!!tr?.open}
                    className="mt-1 inline-flex items-center gap-1 text-[.65rem] text-ink-faint hover:text-gold-deep transition-colors disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h12M9 3v2c0 4.5-2.5 8-6 9M5 9c0 3 2.5 5.5 6 6" />
                      <path d="m13 21 4-9 4 9M14.5 18h5" />
                    </svg>
                    {tr?.loading ? "Translating…" : tr?.open ? "Hide translation" : "Translate"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex items-end gap-2">
            <MayaAvatar size="sm" />
            <div className="bg-paper border border-hairline rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:-.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:-.1s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" />
            </div>
          </motion.div>
        )}

        {error && (
          <p className="relative z-10 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

      </div>

      {/* Quick replies */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-2 overflow-x-auto px-3 sm:px-4 py-2 border-t border-hairline bg-paper/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-hairline bg-paper text-ink-muted hover:border-gold hover:text-ink transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-hairline p-3 sm:p-4 bg-paper/85 backdrop-blur"
      >
        <div className="rounded-2xl border border-hairline bg-white shadow-[0_8px_28px_-20px_rgba(11,25,44,.55)] focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/15 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={`Write or speak in ${lang.label}…`}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-1.5 text-sm outline-none text-ink placeholder:text-ink-faint max-h-32 chat-scroll"
          />
          <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5">
            <p className="text-[.68rem] text-ink-faint pl-1 flex items-center gap-1.5 min-w-0">
              {micError ? (
                <span className="text-red-600 truncate" role="alert">{micError}</span>
              ) : fixing ? (
                <span className="truncate text-gold-deep">Cleaning up typos…</span>
              ) : listening ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="truncate text-gold-deep">
                    Listening… {lang.label} · auto-stops after {SILENCE_MS / 1000}s silence
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm leading-none">{lang.flag}</span>
                  <span className="truncate">Maya replies in {lang.label}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {input.length > 1500 && (
                <span className="text-[.65rem] text-ink-faint tabular-nums">{input.length}/2000</span>
              )}
              <button
                type="button"
                onClick={startMic}
                disabled={!speechSupported}
                aria-label={listening ? "Stop voice input" : `Speak in ${lang.label}`}
                aria-pressed={listening}
                title={
                  speechSupported
                    ? listening
                      ? "Stop voice input"
                      : `Speak in ${lang.label}`
                    : "Voice input is not supported in this browser"
                }
                className={`relative h-9 w-9 rounded-xl border flex items-center justify-center transition-all disabled:opacity-35 disabled:pointer-events-none ${
                  listening
                    ? "bg-red-50 border-red-300 text-red-600"
                    : "border-hairline text-ink-muted hover:border-gold hover:text-gold-deep"
                }`}
              >
                {listening && (
                  <span className="absolute inset-0 rounded-xl bg-red-400/25 animate-ping" aria-hidden />
                )}
                {listening ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="relative">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="h-9 w-9 rounded-xl bg-[linear-gradient(145deg,#152943,#0B192C)] text-ivory flex items-center justify-center shadow-[0_6px_16px_-10px_rgba(11,25,44,.7)] hover:-translate-y-0.5 transition-transform disabled:opacity-35 disabled:pointer-events-none disabled:translate-y-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <p className="hidden sm:block text-[.65rem] text-ink-faint mt-2 px-1">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </div>
  );
}