"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { VocabEntry } from "@/lib/vocab-types";

function mapEntry(e: {
  word: string;
  definition: string;
  pronunciation: string | null;
  context: string;
  translation: string;
  status: "LEARNING" | "MASTERED";
  createdAt: Date;
}): VocabEntry {
  return {
    word: e.word,
    definition: e.definition,
    pronunciation: e.pronunciation ?? "",
    context: e.context,
    translation: e.translation,
    status: e.status === "MASTERED" ? "mastered" : "learning",
    addedAt: e.createdAt.getTime(),
  };
}

export async function getAllVocab(): Promise<VocabEntry[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await db.vocabEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEntry);
}

export async function addVocabBatch(
  words: Omit<VocabEntry, "status" | "addedAt">[]
): Promise<VocabEntry[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const created: VocabEntry[] = [];
  for (const w of words) {
    try {
      const row = await db.vocabEntry.create({
        data: {
          userId: session.user.id,
          word: w.word,
          definition: w.definition,
          pronunciation: w.pronunciation,
          context: w.context,
          translation: w.translation,
        },
      });
      created.push(mapEntry(row));
    } catch (e: unknown) {
      if (typeof e === "object" && e && "code" in e && e.code === "P2002") continue;
      throw e;
    }
  }
  revalidatePath("/vocabulary");
  return created;
}

export async function setVocabStatus(word: string, status: VocabEntry["status"]): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.vocabEntry.update({
    where: { word_userId: { word, userId: session.user.id } },
    data: { status: status === "mastered" ? "MASTERED" : "LEARNING" },
  });
  revalidatePath("/vocabulary");
}

export async function removeVocab(word: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.vocabEntry.deleteMany({ where: { word, userId: session.user.id } });
  revalidatePath("/vocabulary");
}