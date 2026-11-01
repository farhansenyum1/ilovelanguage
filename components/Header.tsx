"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fraunces } from "next/font/google";
import { signIn, signOut } from "next-auth/react";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });

type SessionUser = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
  role?: "USER" | "ADMIN";
};

const LINKS = [
  { href: "/practice", label: "Practice" },
  { href: "/partner", label: "Partner" },
  { href: "/dashboard", label: "Translate" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/settings", label: "Settings" },
];

export default function Header() {
  const [session, setSession] = useState<{ user?: SessionUser } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const load = () => fetch("/api/auth/session").then((r) => r.json()).then(setSession);
    load();
    window.addEventListener("profile-updated", load);
    return () => window.removeEventListener("profile-updated", load);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const u = session?.user;
  const links = u?.role === "ADMIN" ? [...LINKS, { href: "/admin-portal", label: "Admin" }] : LINKS;

  return (
    <header className="sticky top-0 z-50 bg-cream/75 backdrop-blur-xl border-b border-hairline/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link href={u ? "/practice" : "/"} className={`display text-[1.2rem] sm:text-[1.45rem] ${fraunces.className} flex items-center gap-2 min-w-0`}>
          <span className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-lg bg-ink text-ivory flex items-center justify-center text-[.65rem] sm:text-xs font-sans font-semibold not-italic">iL</span>
          <span className="whitespace-nowrap leading-[1.15] pb-0.5"><span className="text-ink">iLove</span><span className="text-gold italic">Language</span></span>
        </Link>

        {u ? (
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    active ? "bg-ink text-ivory" : "text-ink-muted hover:text-ink hover:bg-paper"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
            <a href="#how" className="hover:text-ink transition-colors">Method</a>
            <a href="#how" className="hover:text-ink transition-colors">Features</a>
          </nav>
        )}

        {u && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-ink-muted">@{u.username || u.name?.split(" ")[0]}</span>
            <Link
              href="/settings"
              title="Profile settings"
              className="h-9 w-9 rounded-full bg-gold-soft text-ink flex items-center justify-center text-sm font-semibold overflow-hidden ring-2 ring-paper hover:ring-gold transition-all"
            >
              {u.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.image} alt="" className="h-full w-full object-cover" />
              ) : (
                (u.name?.[0] || "U").toUpperCase()
              )}
            </Link>
            <button
              onClick={() => signOut({ redirectTo: "/" })}
              className="hidden md:inline text-xs text-ink-faint hover:text-ink transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="md:hidden h-9 w-9 -mr-1 rounded-full flex items-center justify-center text-ink-muted hover:bg-paper transition-colors"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        )}

        {!u && (
          <button
            onClick={() => signIn("google", { redirectTo: "/practice" })}
            className="btn btn-primary shrink-0 !py-2.5 !px-4 sm:!px-5 text-sm"
          >
            <span className="hidden sm:inline">Continue with Google</span>
            <span className="sm:hidden">Sign in</span>
          </button>
        )}
      </div>

      {menuOpen && u && (
        <div className="md:hidden border-t border-hairline bg-cream/95 backdrop-blur-xl">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active ? "bg-ink text-ivory" : "text-ink-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ redirectTo: "/" })}
              className="mt-1 px-3 py-2.5 rounded-lg text-left text-sm text-ink-faint hover:bg-paper hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}