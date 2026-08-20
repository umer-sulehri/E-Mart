export interface TranslationEntry {
  key: string;
  en: string;
  ur: string;
}

export interface TranslationRepository {
  findAll(): Promise<TranslationEntry[]>;
  findByKey(key: string): Promise<TranslationEntry | null>;
  upsert(key: string, en: string, ur: string): Promise<TranslationEntry>;
  delete(key: string): Promise<void>;
}
