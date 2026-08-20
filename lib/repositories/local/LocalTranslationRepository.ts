import { TranslationEntry, TranslationRepository } from '../contracts/TranslationRepository';

import en from '@/public/locales/en.json';
import ur from '@/public/locales/ur.json';

const translations = new Map<string, TranslationEntry>();

function seedTranslations() {
  const enKeys = Object.keys(en);
  for (const key of enKeys) {
    translations.set(key, {
      key,
      en: (en as Record<string, string>)[key],
      ur: (ur as Record<string, string>)[key] ?? '',
    });
  }
}

seedTranslations();

export class LocalTranslationRepository implements TranslationRepository {
  async findAll(): Promise<TranslationEntry[]> {
    return Array.from(translations.values());
  }

  async findByKey(key: string): Promise<TranslationEntry | null> {
    return translations.get(key) ?? null;
  }

  async upsert(key: string, enText: string, urText: string): Promise<TranslationEntry> {
    const entry: TranslationEntry = { key, en: enText, ur: urText };
    translations.set(key, entry);
    return entry;
  }

  async delete(key: string): Promise<void> {
    if (!translations.has(key)) throw new Error('Translation key not found');
    translations.delete(key);
  }
}
