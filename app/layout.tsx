import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import FooterYear from "@/components/FooterYear";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "iLoveLanguage - Elegant AI Language Learning",
  description: "Translate instantly and master difficult vocabulary automatically with AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" suppressHydrationWarning className="h-full">
      <body className={`${jakarta.variable} ${fraunces.variable} ${jakarta.className} bg-cream text-ink min-h-full flex flex-col antialiased`}>
        <Header />

        <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8 md:py-12">{children}</main>

        <footer className="mt-16 border-t border-hairline">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
            <FooterYear />
            <p className="italic font-display">&mdash; elegance, distilled.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
