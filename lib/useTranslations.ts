// lib/useTranslations.ts
import { useTranslations as baseUseTranslations } from "next-intl";
import type {
  TranslationKeys,
  Translations,
  NamespaceKeyMap,
} from "./translations";

type Translator<K extends string> = (
  key: K,
  values?: Record<string, unknown>
) => string;

// Overload 1: no namespace -> requires full keys (e.g. "home.hero.slogan")
export function useTranslations(): Translator<TranslationKeys>;

// Overload 2: with namespace -> only inner keys (e.g. "hero.slogan")
export function useTranslations<N extends keyof Translations & string>(
  namespace: N
): Translator<NamespaceKeyMap[N]>;

// Impl
export function useTranslations(namespace?: string) {
  return baseUseTranslations(namespace) as any;
}
