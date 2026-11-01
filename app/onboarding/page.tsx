"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { saveProfile } from "@/app/actions/profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [username, setUsername] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await saveProfile(fd);
    if ("error" in res && res.error) {
      setErr(res.error);
      setLoading(false);
    } else {
      router.push("/practice");
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-16">
      <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-10 items-center">
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .6 }}
          className="hidden md:block"
        >
          <p className="eyebrow mb-4">Step 1 of 1</p>
          <h1 className="display text-4xl lg:text-5xl leading-[.95]">
            Almost<br />there.<br />
            <span className="italic text-gold">Pick your identity.</span>
          </h1>
          <p className="text-ink-muted mt-5 max-w-sm">
            This is how you&rsquo;ll appear across the app and in the admin directory.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {["Unique @username", "Your real first & last name", "Ready to train instantly"].map((t, i) => (
              <li key={t} className="flex items-center gap-3 text-ink-muted">
                <span className="h-6 w-6 rounded-full bg-gold-soft/70 text-gold-deep flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-10 relative h-28">
            <div className="bubble text-base" style={{ top: 0, left: 0, background: "#DCE3C3" }}>Hello!</div>
            <div className="bubble text-base" style={{ top: 34, left: 110, background: "#E8CE72", animationDelay: ".8s" }}>¡Hola!</div>
            <div className="bubble text-base" style={{ top: 68, left: 30, background: "#A9C0DE", animationDelay: "1.3s" }}>Merci!</div>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6, delay: .1 }}
          className="card p-6 md:p-8"
        >
          <div className="md:hidden mb-6">
            <p className="eyebrow mb-2">Step 1 of 1</p>
            <h1 className="display text-3xl leading-[.95]">
              Almost there. <span className="italic text-gold">Pick your identity.</span>
            </h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="eyebrow">Username</span>
                <span className="text-[.7rem] text-ink-faint">{username.length}/20</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-sm">@</span>
                <input
                  name="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  placeholder="elegantlearner"
                  className="w-full border border-hairline rounded-lg pl-8 pr-3.5 py-3.5 outline-none focus:border-gold focus:ring-4 focus:ring-gold-soft/30 transition-all bg-paper text-ink placeholder:text-ink-faint"
                />
              </div>
              <span className="text-xs text-ink-faint mt-1.5 block">3–20 characters · lowercase, numbers, underscore</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" name="firstName" placeholder="Jane" />
              <Field label="Last name" name="lastName" placeholder="Doe" />
            </div>

            {err && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                {err}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-40">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-ivory/40 border-t-ivory animate-spin" />
                  Saving…
                </>
              ) : (
                <>Enter the app →</>
              )}
            </button>

            <p className="text-xs text-ink-faint text-center">
              You can change these later from your profile.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      <input
        name={name}
        required
        placeholder={placeholder}
        className="w-full border border-hairline rounded-lg p-3.5 outline-none focus:border-gold focus:ring-4 focus:ring-gold-soft/30 transition-all bg-paper text-ink placeholder:text-ink-faint"
      />
    </label>
  );
}