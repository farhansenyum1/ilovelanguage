export interface VocabWord {
  word: string;
  definition: string;
  pronunciation: string;
}

export interface TranslationResult {
  translation: string;
  difficultWords: VocabWord[];
}