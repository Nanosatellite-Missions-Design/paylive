// lib/translations.ts
import en from "@/locales/en.json"; // adjust path

// helper to join dot paths
type Dot<P extends string, K extends string> = P extends "" ? K : `${P}.${K}`;

// Full leaf paths from the root, e.g. "Dashboard.Lives.title"
type FullKeys<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? FullKeys<T[K], Dot<P, K>>
        : Dot<P, K>;
    }[keyof T & string]
  : never;

// Relative keys inside a node, e.g. for Dashboard => "Lives.title" | "Orders.title"
// for Dashboard.Lives => "title" | "LiveCard.products" etc.
type RelativeKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K | `${K}.${RelativeKeys<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

// All object-node paths (namespaces) as dotted strings, e.g. "Dashboard" | "Dashboard.Lives"
type ObjectPaths<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? Dot<P, K> | ObjectPaths<T[K], Dot<P, K>>
        : never;
    }[keyof T & string]
  : never;

// Lookup type: get the type at a dotted path "A.B.C"
type Lookup<T, P extends string> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? Lookup<T[K], R>
    : never
  : P extends keyof T
  ? T[P]
  : never;

export type Translations = typeof en;

// all full keys (for useTranslations() with no namespace)
export type TranslationKeys = FullKeys<Translations>;

// map every object-path namespace to the union of its relative inner keys
export type NamespaceKeyMap = {
  [P in ObjectPaths<Translations>]: RelativeKeys<Lookup<Translations, P>>;
};
