// lib/translations.ts
import en from "@/locales/en.json"; // adjust path

// "a.b.c" keys for any nested object
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type Translations = typeof en;

// All keys WITH top-level namespace prefix, e.g. "home.hero.slogan"
export type TranslationKeys = NestedKeyOf<Translations>;

// Map each namespace to its INNER keys (WITHOUT the "home." prefix)
export type NamespaceKeyMap = {
  [N in keyof Translations & string]: NestedKeyOf<Translations[N]>;
};
