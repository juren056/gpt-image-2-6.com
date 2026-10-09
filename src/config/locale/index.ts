// Locale display names for the language switcher UI.
// Locales themselves are defined in project.inlang/settings.json and
// exposed at runtime via @/paraglide/runtime.js (locales, baseLocale).
export const localeNames: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
  pt: 'Português',
  it: 'Italiano',
  zh: '简体中文',
  'zh-TW': '繁體中文',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  nl: 'Nederlands',
  th: 'ภาษาไทย',
  pl: 'Polski',
  hu: 'Magyar',
};

export function isRtlLocale(locale: string): boolean {
  return locale === 'ar';
}
