"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  {
    href: "/admin-portal",
    label: "Overview",
    icon: (
      <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z" />
    ),
  },
  {
    href: "/admin-portal/ai",
    label: "AI Integration",
    icon: (
      <path d="M12 2 9.5 8.5 3 11l6.5 2.5L12 20l2.5-6.5L21 11l-6.5-2.5L12 2Z" />
    ),
  },
  {
    href: "/admin-portal/users",
    label: "Users",
    icon: (
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 0a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A13 13 0 0 0 8 13Zm8 0c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4Z" />
    ),
  },
];

export default function AdminShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="py-6">
      <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-10">
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-1 px-1 pb-1 lg:pb-0">
            {NAV.map((item) => {
              const active =
                item.href === "/admin-portal"
                  ? pathname === "/admin-portal"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                    active
                      ? "bg-ink text-ivory"
                      : "text-ink-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={active ? "text-gold-soft" : "text-ink-faint group-hover:text-gold"}
                  >
                    {item.icon}
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="hidden lg:block mt-6 pt-6 border-t border-hairline">
            <Link
              href="/practice"
              className="flex items-center gap-2 text-xs text-ink-faint hover:text-ink transition-colors"
            >
              <span aria-hidden>&larr;</span> Back to app
            </Link>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <header className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-hairline">
            <div className="space-y-2">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="display text-3xl md:text-4xl">{title}</h1>
              {description && <p className="text-sm text-ink-muted max-w-xl">{description}</p>}
            </div>
            {actions}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}