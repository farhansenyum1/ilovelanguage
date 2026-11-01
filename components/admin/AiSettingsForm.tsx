"use client";

import { useState, useTransition } from "react";
import { saveAiSettings, testAiConnection } from "@/app/actions/ai";

const PRESETS = [
  { label: "OpenRouter", provider: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
  { label: "Groq", provider: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.1-70b-versatile" },
  { label: "DeepSeek", provider: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { label: "Together AI", provider: "Together AI", baseUrl: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { label: "OpenAI", provider: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "Custom", provider: "", baseUrl: "", model: "" },
];

type Initial = {
  provider: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  hasKey: boolean;
  updatedAt: string | null;
};

export default function AiSettingsForm({ initial }: { initial: Initial | null }) {
  const [provider, setProvider] = useState(initial?.provider ?? "OpenRouter");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "https://openrouter.ai/api/v1");
  const [model, setModel] = useState(initial?.model ?? "openai/gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; msg?: string }>({ kind: "idle" });
  const [testing, setTesting] = useState(false);
  const [pending, startTransition] = useTransition();

  function applyPreset(label: string) {
    const p = PRESETS.find((x) => x.label === label);
    if (!p) return;
    setProvider(p.provider || provider);
    setBaseUrl(p.baseUrl);
    setModel(p.model);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    const fd = new FormData();
    fd.set("provider", provider);
    fd.set("baseUrl", baseUrl);
    fd.set("model", model);
    fd.set("apiKey", apiKey);
    if (enabled) fd.set("enabled", "on");

    startTransition(async () => {
      const res = await saveAiSettings(fd);
      if ("error" in res && res.error) setStatus({ kind: "error", msg: res.error });
      else {
        setApiKey("");
        setStatus({ kind: "ok", msg: "Pengaturan AI tersimpan." });
      }
    });
  }

  async function onTest() {
    setTesting(true);
    setStatus({ kind: "idle" });
    const res = await testAiConnection();
    setTesting(false);
    if ("error" in res && res.error) setStatus({ kind: "error", msg: res.error });
    else setStatus({ kind: "ok", msg: res.message || "Koneksi berhasil." });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
      <form onSubmit={onSubmit} className="card p-6 md:p-7 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="eyebrow block mb-2">Provider</span>
            <select
              value={PRESETS.some((p) => p.label === provider) ? provider : "Custom"}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full border border-hairline rounded-lg p-3 bg-paper text-ink outline-none focus:border-gold transition-colors"
            >
              {PRESETS.map((p) => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow block mb-2">Model</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="openai/gpt-4o-mini"
              className="w-full border border-hairline rounded-lg p-3 bg-paper text-ink outline-none focus:border-gold transition-colors"
            />
          </label>
        </div>

        <label className="block">
          <span className="eyebrow block mb-2">Base URL (OpenAI-compatible)</span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://openrouter.ai/api/v1"
            className="w-full border border-hairline rounded-lg p-3 bg-paper text-ink outline-none focus:border-gold transition-colors font-mono text-sm"
          />
          <span className="text-xs text-ink-faint mt-1.5 block">
            Endpoint akhir: <code>/chat/completions</code> di bawah URL ini.
          </span>
        </label>

        <label className="block">
          <span className="eyebrow block mb-2">API Key</span>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={initial?.hasKey ? "•••••••• (tersimpan — isi untuk ganti)" : "sk-..."}
              className="flex-1 border border-hairline rounded-lg p-3 bg-paper text-ink outline-none focus:border-gold transition-colors font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="btn btn-ghost text-xs px-3"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <span className="text-xs text-ink-faint mt-1.5 block">
            Disimpan di database. Tidak pernah dikirim ke client setelah tersimpan.
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--gold)]"
          />
          <span className="text-sm text-ink">Aktifkan AI untuk semua user</span>
        </label>

        {status.kind !== "idle" && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              status.kind === "ok"
                ? "bg-gold-soft/50 text-ink"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
          >
            {status.msg}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-40">
            {pending ? "Menyimpan…" : "Simpan pengaturan"}
          </button>
          <button type="button" onClick={onTest} disabled={testing} className="btn btn-ghost disabled:opacity-40">
            {testing ? "Menguji…" : "Test koneksi"}
          </button>
        </div>
      </form>

      <aside className="card p-5 space-y-3 text-sm">
        <p className="eyebrow">Status</p>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${enabled && initial?.hasKey ? "bg-green-600" : "bg-ink-faint"}`} />
          <span className="text-ink">
            {enabled && initial?.hasKey ? "Terhubung" : initial?.hasKey ? "Nonaktif" : "Belum dikonfigurasi"}
          </span>
        </div>
        {initial?.updatedAt && (
          <p className="text-xs text-ink-faint">
            Diperbarui {new Date(initial.updatedAt).toLocaleString("id-ID")}
          </p>
        )}
        <div className="rule-gold !my-3" />
        <p className="text-xs text-ink-faint leading-relaxed">
          Provider apa pun yang kompatibel dengan OpenAI Chat Completions bisa dipakai.
          Jika provider menolak mode JSON, sistem otomatis mencoba ulang tanpa mode tersebut.
        </p>
      </aside>
    </div>
  );
}