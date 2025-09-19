// lib/useTranslations.ts
import { useTranslations as baseUseTranslations } from "next-intl";
import type { TranslationKeys, NamespaceKeyMap } from "./translations";

type Translator<K extends string> = (
  key: K,
  values?: Record<string, unknown>
) => string;

// Overload 1: no namespace -> full keys (root dotted paths)
export function useTranslations(): Translator<TranslationKeys>;

// Overload 2: namespace can be any nested object path ("Dashboard" | "Dashboard.Lives" | ...)
export function useTranslations<N extends keyof NamespaceKeyMap & string>(
  namespace: N
): Translator<NamespaceKeyMap[N]>;

// Implementation -- runtime still delegated to next-intl
export function useTranslations(namespace?: string) {
  return baseUseTranslations(namespace) as any;
}
