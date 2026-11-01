## UX Design Audit Report
**Scope:** Seluruh front-end lokal — landing, dashboard translate, vocabulary, admin portal, layout global, design tokens.
**Source:** `app/layout.tsx`, `app/page.tsx`, `app/dashboard/page.tsx`, `app/vocabulary/page.tsx`, `app/admin-portal/page.tsx`, `components/TranslationBox.tsx`, `lib/gemini.ts`, `lib/vocab.ts`, `app/globals.css`
**Interface type:** Web app edukasi (translate EN-ID + arsip kosakata), single-user MVP tanpa auth nyata.
**Limitations:** Dinilai dari source code; state runtime (animasi framer-motion aktual, kontras hasil komputasi browser) tidak diverifikasi visual.

### Summary
| Severity | Jumlah |
|---|---|
| 4 Catastrophe | 0 |
| 3 Major | 3 |
| 2 Minor | 5 |
| 1 Cosmetic | 3 |
| **Total** | **11** |

Tidak ada yang memblokir tugas utama (translate lalu simpan kata). Semua temuan severity 3 adalah degradasi pengalaman, bukan kegagalan fungsi.

### Quick Wins
1. **Nav mobile mati total** (`layout.tsx:48`) — tombol hamburger tanpa handler dan tanpa menu alternatif. Fix: render nav sebagai panel collapsible di bawah header saat ditekan, atau hapus tombolnya sampai drawer siap.
2. **Toast maintenance selalu di DOM** (`page.tsx:31-39`) — hanya opacity 0, screen reader tetap membacanya. Fix: `{showToast && <motion.div role="status" ...>}` supaya mount/unmount sesuai kondisi.
3. **Alias CSS mati** (`globals.css:131-133`) — `.card-elegant` dan `.text-gradient-gold` tidak dipakai komponen mana pun, plus `composes:` bukan sintaks valid Tailwind v4. Fix: hapus kedua baris.

### Findings (urut severity menurun)

#### [Severity 3] Navigasi mobile tidak berfungsi
- Principle: Visibility of System Status, User Control and Freedom
- Location: `app/layout.tsx:48-50`
- Issue: Tombol hamburger tampil di `< md` tetapi tanpa `onClick`, tidak menargetkan elemen apa pun. Nav Learn/Vocabulary/Admin disembunyikan `hidden md:flex`.
- User impact: User ponsel menekan ikon menu, tidak terjadi apa-apa, lalu menyimpulkan situs rusak. Mereka kehilangan akses ke seluruh fitur kecuali tautan di landing.
- Fix: Tambah state `open` di wrapper client kecil, render `<nav>` vertikal di bawah header saat open, set `aria-expanded` + `aria-controls` pada tombol. Alternatif jujur untuk MVP: hapus tombol, biarkan footer membawa tautan navigasi.

#### [Severity 3] Kartu clickable tanpa affordance keyboard
- Principle: Accessibility, Affordances and Signifiers
- Location: `app/vocabulary/page.tsx:51-55`, `app/globals.css:65-76`
- Issue: Item kosakata dirender sebagai `<button className="card">` — benar secara semantik — tetapi `.card` hanya punya aturan hover. Tidak ada `.card:focus-visible`, jadi pengguna keyboard mendapat outline default browser yang bertabrakan dengan border-radius kartu.
- User impact: Pengguna tab tidak bisa melihat kartu mana yang difokus sebelum Enter; mereka menebak-nebak posisi di grid tiga kolom.
- Fix: Tambah di `globals.css`: `.card:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }` — konsisten dengan `.btn:focus-visible` yang sudah ada.

#### [Severity 3] Dialog detail tanpa Escape, focus trap, dan peran ARIA
- Principle: User Control and Freedom, Accessibility
- Location: `app/vocabulary/page.tsx:58-92`
- Issue: Modal menutup hanya via klik luar atau tombol silang. Tidak ada handler Escape, tidak ada pemindahan fokus ke modal, tidak ada `role="dialog"` / `aria-modal="true"` / label.
- User impact: Keyboard user masuk ke modal, tab lolos ke konten di belakang layar, satu-satunya jalan keluar adalah mouse. Pemakai teknologi bantu tidak tahu sedang berada di dalam dialog.
- Fix: Pada motion.div modal tambahkan `role="dialog" aria-modal="true" aria-labelledby` (id heading kata), `onKeyDown` untuk Escape memanggil `setSelected(null)`, dan `autoFocus` pada tombol Close.

#### [Severity 2] State error translate menampilkan pesan teknis
- Principle: Match Between System and Real World, Error Recovery
- Location: `app/api/translate/route.ts:18-21`, `components/TranslationBox.tsx:59-61`
- Issue: Kegagalan apa pun (key salah, jaringan, JSON Gemini cacat) menghasilkan teks "Translation failed. Check your GEMINI_API_KEY." yang ditampilkan mentah ke end-user.
- User impact: Pelajar biasa membaca instruksi debug developer, tidak paham aksinya gagal kenapa, lalu mencoba ulang tanpa batas atau menyerah.
- Fix: Pisahkan pesan user-facing ("Terjemahan gagal. Coba lagi sebentar.") dari log server. Deteksi penyebab di route: key kosong jadi 503 dengan pesan berbeda; parse gagal retry sekali di `lib/gemini.ts` sebelum menyerah.

#### [Severity 2] Istilah internal bocor ke microcopy
- Principle: Match Between System and Real World
- Location: `components/TranslationBox.tsx:104-109`
- Issue: Teks "{savedCount} hard words filed in My Vocabulary" memakai frasa informal English sementara audiensnya penutur Indonesia.
- User impact: User tidak langsung paham arti "hard words"; terasa seperti pesan sistem daripada pencapaian belajar.
- Fix: Ganti ke "N kata baru disimpan ke Kosakatamu". Konsistenkan bahasa seluruh microcopy — saat ini campur EN/ID tanpa aturan (`title="Kata sulit — tersimpan otomatis"` di TranslationBox.tsx:18 vs placeholder English).

#### [Severity 2] Tidak ada konfirmasi atau undo untuk hapus kata
- Principle: User Control and Freedom, Error Prevention
- Location: `app/vocabulary/page.tsx:22-26, 87`
- Issue: Tombol Delete menghapus entri localStorage seketika, tanpa dialog dan tanpa undo.
- User impact: Salah klik menghapus kata beserta kalimat konteksnya permanen. Data hanya ada di perangkat itu, kerugian tidak bisa dipulihkan dari server.
- Fix: Minimal ubah label jadi "Tap again to confirm" pada klik pertama. Skala penuh: snackbar undo 5 detik sebelum writeAll commit.

#### [Severity 2] Skeleton loading tidak diumumkan ke screen reader
- Principle: Visibility of System Status, Accessibility
- Location: `components/TranslationBox.tsx:84-90`
- Issue: Pulse bar muncul tanpa teks maupun role status. Call LLM memakan 1-3 detik.
- User impact: Screen reader user diam total selama proses; mereka tidak tahu sistem bekerja atau macet.
- Fix: Tambah `<p className="sr-only" role="status">Translating…</p>` di blok skeleton.

#### [Severity 2] Select target language menyesatkan
- Principle: Error Prevention, Consistency and Standards
- Location: `app/page.tsx:8-42`
- Issue: Dropdown menawarkan Spanish/French/Japanese yang semuanya memicu toast "under maintenance", padahal mesin hanya mendukung EN-ID.
- User impact: User memilih bahasa lain, melihat toast samar 3 detik, bingung apakah pilihannya tersimpan. Fitur menjanjikan kemampuan yang tidak ada.
- Fix: Hapus opsi nonaktif atau beri `disabled` dengan keterangan "(segera)".

#### [Severity 1] Kontras gold-on-ivory untuk eyebrow di ambang batas
- Principle: Accessibility
- Location: `app/globals.css:56-62` (--gold #B8935A di atas --ivory #FBF8F3)
- Issue: Rasio kontras sekitar 3.1:1. Ukuran 0.75rem uppercase borderline WCAG AA.
- User impact: Label seksi paling kecil hampir tidak terbaca di layar gelap atau bawah cahaya matahari.
- Fix: Tambah token --gold-deep (#9A7843) khusus teks eyebrow; biarkan gold terang untuk aksen dekoratif.

#### [Severity 1] Footer tahun hardcoded
- Principle: Consistency
- Location: `app/layout.tsx:58`
- Issue: Copyright 2026 tertulis literal.
- User impact: Tahun basi mulai Januari 2027; merusak kesan terawat.
- Fix: `new Date().getFullYear()`.

#### [Severity 1] Hint shortcut keyboard tidak universal
- Principle: Flexibility and Efficiency of Use
- Location: `components/TranslationBox.tsx:71, 76`
- Issue: Handler menerima metaKey atau ctrlKey, tetapi label hanya menulis simbol Apple. Pengguna Windows/Linux melihat simbol asing sementara Ctrl+Enter sebenarnya berfungsi.
- User impact: Shortcut terdokumentasi setengah; efisiensi power-user hilang di non-Mac.
- Fix: Tulis netral "Ctrl/Cmd + Enter".

### Strengths
1. **Design token disiplin** (P8 Aesthetic, P4 Consistency): semua warna, shadow, font mengalir dari :root di globals.css; tidak ada hex lepas di komponen. Tema ivory-navy-gold koheren di semua halaman.
2. **Input divalidasi berlapis** (P5 Error Prevention): maxLength 5000 di textarea, cek tipe plus trim plus panjang di API route, escape regex karakter khusus sebelum pattern highlight di TranslationBox.tsx:10-11.
3. **Feedback progresif lengkap** (P1 Visibility): disabled button saat loading, skeleton animasi, counter karakter hidup, toast jumlah kata tersimpan — alur translate merespons di setiap tahap.
4. **Dedup kosakata case-insensitive** (P4 Consistency): addVocabBatch mencegah duplikat via Set lowercase, ordering stabil lewat addedAt plus idx.
5. **Semantik dasar baik** (P13 Accessibility): html lang="id", aria-label pada tombol menu dan close, tombol asli bukan div clickable untuk item vocab.

### Catatan cakupan prinsip
P1 visibilitas status (S2.1, S2.4) · P2 match real world (S2.1, S2.2) · P3 control freedom (S3.1, S3.3, S2.3) · P4 consistency (S2.2, S1.1, S1.2) · P5 error prevention (S2.3, S2.5) · P6 recognition recall (Strength 3, grid vocab) · P7 flexibility (S1.3) · P8 aesthetic minimalist (Strength 1) · P9 error recovery (S2.1) · P10 help docs — tidak ada fitur bantuan sama sekali; wajar untuk MVP alat tunggal, tambah when onboarding dilakukan · P11 affordances (S3.2, S2.5) · P12 structure (Strength 1, pola halaman seragam eyebrow-display-konten) · P13 accessibility (S3.2, S3.3, S2.4, S1.1) · P14 perceptibility (S3.3, S2.1) · P15 tolerance (S2.3 delete tanpa undo, S2.2 bahasa).
