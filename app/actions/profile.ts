"use server";

import { auth, unstable_update } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Username: 3–20 chars, huruf kecil/angka/underscore." };
  }
  if (!firstName || !lastName) {
    return { error: "Nama depan & belakang wajib diisi." };
  }

  const onboardedAt = session.user.onboardedAt ? undefined : new Date();
  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { username, firstName, lastName, ...(onboardedAt ? { onboardedAt } : {}) },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return { error: "Username sudah dipakai." };
    }
    throw e;
  }

  await unstable_update({
    user: {
      username,
      firstName,
      lastName,
      ...(onboardedAt ? { onboardedAt } : {}),
    },
  } as Parameters<typeof unstable_update>[0]);

  revalidatePath("/practice");
  revalidatePath("/settings");
  return { ok: true };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function saveProfilePhoto(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file foto." };
  if (!file.type.startsWith("image/")) return { error: "File harus berupa gambar." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Ukuran foto maksimal 2 MB." };

  const data = Buffer.from(await file.arrayBuffer());
  await db.avatar.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, mime: file.type, data },
    update: { mime: file.type, data },
  });

  const image = `/api/avatar/${session.user.id}?v=${Date.now()}`;
  await db.user.update({ where: { id: session.user.id }, data: { image } });
  await unstable_update({ user: { image } } as Parameters<typeof unstable_update>[0]);

  revalidatePath("/settings");
  return { ok: true, image };
}

export async function removeProfilePhoto() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.avatar.deleteMany({ where: { userId: session.user.id } });
  await db.user.update({ where: { id: session.user.id }, data: { image: null } });
  await unstable_update({ user: { image: null } } as Parameters<typeof unstable_update>[0]);

  revalidatePath("/settings");
  return { ok: true };
}