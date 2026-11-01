export interface VocabEntry {
  word: string;
  definition: string;
  pronunciation: string;
  context: string;
  translation: string;
  status: "learning" | "mastered";
  addedAt: number;
}