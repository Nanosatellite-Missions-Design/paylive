// import {getRequestConfig} from 'next-intl/server';

// export default getRequestConfig(async () => {
//   // Provide a static locale, fetch a user setting,
//   // read from `cookies()`, `headers()`, etc.
//   let locale = 'en';

//   return {
//     locale,
//     messages: (await import(`../../messages/${locale}.json`)).default
//   };
// });
// app/[...]/request.ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return {
    locale,
    messages: (await import(`../../locales/${locale}.json`)).default,
  };
});
