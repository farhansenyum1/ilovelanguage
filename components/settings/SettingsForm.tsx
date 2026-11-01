"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveProfile, saveProfilePhoto, removeProfilePhoto } from "@/app/actions/profile";

type Initial = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
};

async function resizeImage(file: File, max = 512): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
  if (!blob) return file;
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export default function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState(initial.image);
  const [username, setUsername] = useState(initial.username);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ kind: "idle" | "ok" | "error"; msg?: string }>({ kind: "idle" });
  const [photoStatus, setPhotoStatus] = useState<{ kind: "idle" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || initial.email;

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus({ kind: "idle" });
    const fd = new FormData();
    fd.set("username", username);
    fd.set("firstName", firstName);
    fd.set("lastName", lastName);
    const res = await saveProfile(fd);
    setSavingProfile(false);
    if ("error" in res && res.error) {
      setProfileStatus({ kind: "error", msg: res.error });
    } else {
      setProfileStatus({ kind: "ok", msg: "Profil diperbarui." });
      window.dispatchEvent(new Event("profile-updated"));
      router.refresh();
    }
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoStatus({ kind: "error", msg: "File harus berupa gambar." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoStatus({ kind: "error", msg: "Ukuran asli maksimal 8 MB." });
      return;
    }

    setSavingPhoto(true);
    setPhotoStatus({ kind: "idle" });
    try {
      const resized = await resizeImage(file);
      const fd = new FormData();
      fd.set("photo", resized);
      const res = await saveProfilePhoto(fd);
      if ("error" in res && res.error) {
        setPhotoStatus({ kind: "error", msg: res.error });
      } else if ("ok" in res) {
        setImage(res.image ?? null);
        setPhotoStatus({ kind: "ok", msg: "Foto profil diperbarui." });
        window.dispatchEvent(new Event("profile-updated"));
        router.refresh();
      }
    } catch {
      setPhotoStatus({ kind: "error", msg: "Gagal memproses gambar." });
    } finally {
      setSavingPhoto(false);
    }
  }

  async function onRemovePhoto() {
    setSavingPhoto(true);
    setPhotoStatus({ kind: "idle" });
    const res = await removeProfilePhoto();
    setSavingPhoto(false);
    if ("error" in res && res.error) setPhotoStatus({ kind: "error", msg: res.error });
    else {
      setImage(null);
      setPhotoStatus({ kind: "ok", msg: "Foto dihapus." });
      window.dispatchEvent(new Event("profile-updated"));
      router.refresh();
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      <section className="card p-6 space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-gold-soft text-ink flex items-center justify-center text-4xl font-semibold ring-4 ring-paper shadow-lg">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={image} src={image} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                (firstName?.[0] || initial.email[0] || "U").toUpperCase()
              )}
            </div>
            {savingPhoto && (
              <span className="absolute inset-0 rounded-full bg-ink/40 flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border-2 border-ivory/40 border-t-ivory animate-spin" />
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="font-medium text-ink">{fullName}</p>
            <p className="text-sm text-ink-faint">@{username || "username"}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={savingPhoto}
              className="btn btn-primary !py-2.5 !px-4 text-sm disabled:opacity-40"
            >
              {image ? "Ganti foto" : "Upload foto"}
            </button>
            {image && (
              <button
                type="button"
                onClick={onRemovePhoto}
                disabled={savingPhoto}
                className="btn btn-ghost !py-2.5 !px-4 text-sm text-red-600 border-red-200 hover:border-red-400 hover:text-red-700 disabled:opacity-40"
              >
                Hapus
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
          <p className="text-[.7rem] text-ink-faint mt-2">JPG/PNG · otomatis diperkecil ke 512px</p>
          {photoStatus.kind !== "idle" && (
            <p className={`text-xs mt-2 ${photoStatus.kind === "ok" ? "text-green-700" : "text-red-600"}`} role="status">
              {photoStatus.msg}
            </p>
          )}
        </div>

        <div className="rule-gold !my-2" />

        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-faint">Email</dt>
            <dd className="text-ink truncate">{initial.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-faint">Role</dt>
            <dd>
              <span className={`text-xs px-2 py-0.5 rounded-full ${initial.role === "ADMIN" ? "bg-ink text-ivory" : "bg-hairline text-ink-muted"}`}>
                {initial.role}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-faint">Member since</dt>
            <dd className="text-ink">
              {new Date(initial.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6 md:p-7 space-y-5">
        <div>
          <h2 className="display text-xl">Identity</h2>
          <p className="text-sm text-ink-muted mt-1">Nama ini tampil di aplikasi dan direktori admin.</p>
        </div>

        <form onSubmit={onSaveProfile} className="space-y-5">
          <label className="block">
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">Username</span>
              <span className="text-[.7rem] text-ink-faint">{username.length}/20</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-sm">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                required
                className="w-full border border-hairline rounded-lg pl-8 pr-3.5 py-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold-soft/30 transition-all bg-paper text-ink"
              />
            </div>
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="eyebrow block mb-2">First name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border border-hairline rounded-lg p-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold-soft/30 transition-all bg-paper text-ink"
              />
            </label>
            <label className="block">
              <span className="eyebrow block mb-2">Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-hairline rounded-lg p-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold-soft/30 transition-all bg-paper text-ink"
              />
            </label>
          </div>

          <label className="block">
            <span className="eyebrow block mb-2">Email</span>
            <input
              value={initial.email}
              readOnly
              className="w-full border border-hairline rounded-lg p-3 bg-cream/60 text-ink-faint cursor-not-allowed"
            />
            <span className="text-xs text-ink-faint mt-1.5 block">Email dikelola oleh Google sign-in.</span>
          </label>

          {profileStatus.kind !== "idle" && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                profileStatus.kind === "ok" ? "bg-gold-soft/50 text-ink" : "bg-red-50 text-red-700 border border-red-200"
              }`}
              role="status"
            >
              {profileStatus.msg}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={savingProfile} className="btn btn-primary disabled:opacity-40">
              {savingProfile ? "Menyimpan…" : "Simpan perubahan"}
            </button>
            <Link href="/practice" className="text-sm text-ink-faint hover:text-ink transition-colors">
              Kembali
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}