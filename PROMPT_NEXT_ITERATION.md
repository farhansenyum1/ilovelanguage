# Prompt: iLoveLanguage — Iterasi Penutup Gap PRD

## Peran
Full-Stack Web Developer + UI/UX Expert. Lanjutkan codebase `iLoveLanguage` yang sudah ada (Next.js 16, Tailwind v4, Framer Motion, Google Gemini). Jangan rewrite dari nol — patch delta sekecil mungkin.

## Konteks Sekarang (sudah jadi & jalan)
- Landing `/`, Dashboard `/dashboard` (TranslationBox), Vocabulary `/vocabulary`, Admin `/admin-portal` (mock).
- `/api/translate` → `lib/gemini.ts` (`gemini-2.0-flash`) → return `{ translation, difficultWords[] }`.
- Vocab disimpan via `lib/vocab.ts` ke **localStorage**.
- Desain ivory/navy/gold + Inter + Playfair sudah konsisten di landing & dashboard.

## Yang HARUS diselesaikan (urut prioritas)

### P0 — Blocker keamanan & konsistensi
1. **Auth NextAuth.js** (FR-01, NFR-04)
   - Provider Credentials + bcrypt hash password.
   - JWT session strategy.
   - Middleware proteksi rute: `/dashboard`, `/vocabulary` butuh session; `/admin-portal` butuh role `ADMIN`.
   - Halaman `/login` dan `/register` dengan form elegan (pakai `.card`, `.btn-primary`, spacing sama seperti landing).

2. **Ganti localStorage → Prisma + PostgreSQL (Supabase)** 
   - Skema minimal: `User(id, email, passwordHash, role)`, `VocabEntry(id, userId, word, definition, pronunciation, context, translation, status, addedAt)`, `TranslationLog(id, userId, sourceText, translatedText, createdAt, latencyMs)`.
   - Refactor `lib/vocab.ts`: semua fungsi terima `userId` param, query via Prisma client. Hapus guard `typeof window === "undefined"`.
   - Seed script untuk demo user + sample vocab.

3. **Perbaiki CSS variables rusak di `app/vocabulary/page.tsx`**
   - Ganti `--color-border-light` → `border-hairline`, `--text-primary` → `text-ink`, `--text-secondary` → `text-ink-muted`, `--color-brand-gold` → `gold`.
   - Pastikan modal detail konsisten dengan `.card` styling di halaman lain.

### P1 — Kualitas produksi
4. **Mobile navigation berfungsi**
   - Hamburger button di `layout.tsx` perlu state toggle + dropdown menu vertikal berisi link Learn / My Vocabulary / Admin.
   - Animasi slide-down pakai framer-motion, backdrop blur mirip header desktop.

5. **Rate limiting di `/api/translate`**
   - Implementasi sederhana: in-memory Map per IP dengan window 60 detik, max 20 request. Return 429 saat exceeded.
   - Atau pakai `@upstash/ratelimit` jika Redis tersedia.

6. **Fix ESLint errors**
   - `vocabulary/page.tsx:12` — lazy init: `useState<VocabEntry[]>(() => getAllVocab())` dengan guard SSR tetap diperlukan sampai DB siap. Setelah DB, pindah fetch ke server component atau SWR.
   - `admin-portal/page.tsx:3` — hapus `useEffect` unused import.

7. **Instrumentasi latency (NFR-02)**
   - Catat `Date.now()` sebelum dan sesudah `model.generateContent()` di `lib/gemini.ts`.
   - Simpan ke kolom `latencyMs` di `TranslationLog`.
   - Tampilkan avg response time real di admin dashboard (bukan hardcoded "1.2s").

### P2 — Lengkapi scope PRD
8. **Admin: User Management table** (FR-09)
   - Tabel paginated: email, tanggal join, total translations, last active.
   - Aksi ban/suspend (toggle field `isActive` di User model).

9. **Halaman Profil & Pengaturan**
   - Edit nama/email, ubah password, preferensi bahasa target (meski masih EN-only, sediakan placeholder).
   - Link logout.

10. **Polish animasi & empty states**
    - Skeleton shimmer lebih halus di TranslationBox.
    - Empty state ilustratif di Vocabulary ("Belum ada kata sulit. Mulai translate kalimat pertamamu.") dengan CTA ke dashboard.

## Definisi Selesai
- [ ] Semua rute terproteksi middleware; akses tanpa login redirect ke `/login`.
- [ ] Data vocab persisten lintas perangkat (PostgreSQL).
- [ ] `npm run lint` bersih (0 error, 0 warning).
- [ ] `npm run build` sukses tanpa warning hydration mismatch.
- [ ] Responsive test: layout utuh di viewport 320px, 768px, 1440px, 4K.
- [ ] Admin dashboard tampilkan statistik real dari DB (total users, translations today, top words aggregated).
- [ ] README updated dengan instruksi setup lengkap.

## Format Keluaran
- Patch per file (diff jelas, bukan rewrite penuh kecuali file baru).
- Ringkasan migrasi DB (prisma/schema.prisma final).
- Update README: env vars baru (`DATABASE_URL`, `NEXTAUTH_SECRET`, `GEMINI_API_KEY`), perintah setup (`npx prisma migrate dev`, `npx prisma generate`), langkah deploy ke Vercel + Supabase.
- Tabel penelusuran: FR/NFR ID → file/komit yang menutupinya.