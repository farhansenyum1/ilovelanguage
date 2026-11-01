import Link from "next/link";
import TranslationBox from "@/components/TranslationBox";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="eyebrow">Instant Translate</p>
          <h1 className="display text-4xl md:text-6xl leading-[.95]">
            Read, translate,<br />
            <span className="italic text-gold">remember.</span>
          </h1>
          <p className="text-ink-muted max-w-md">
            Paste an English sentence. The AI returns the Indonesian rendering and quietly files every word worth keeping.
          </p>
        </div>
        <Link href="/vocabulary" className="btn btn-ghost text-sm hidden sm:inline-flex">
          My vocabulary →
        </Link>
      </header>

      <TranslationBox />
    </div>
  );
}