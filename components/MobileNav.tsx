"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Learn" },
  { href: "/vocabulary", label: "My Vocabulary" },
  { href: "/admin-portal", label: "Admin" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 text-ink-muted"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          {open ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
        </svg>
      </button>
      {/* ponytail: no animation library needed for MVP collapse; add framer-motion when polish pass ships */}
      {open && (
        <nav id="mobile-nav" className="absolute top-full left-0 right-0 bg-ivory border-b border-hairline shadow-lg md:hidden z-40">
          <div className="flex flex-col py-2 px-6 gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm text-ink-muted hover:text-ink transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}