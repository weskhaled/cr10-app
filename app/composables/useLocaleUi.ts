/* Locale helpers for the interface: text direction and dates in the
   current language. (Exam content stays French, marked lang="fr" dir="ltr".) */
const DATE_LOCALE: Record<string, string> = { en: 'en-GB', fr: 'fr-FR', ar: 'ar' }

export function useLocaleUi() {
  const { locale, locales } = useI18n()
  const dir = computed(() => {
    const current = locales.value.find((l) => (typeof l === 'string' ? l : l.code) === locale.value)
    return typeof current === 'object' && current.dir === 'rtl' ? 'rtl' : 'ltr'
  })
  const date = (iso: string) => formatDate(iso, DATE_LOCALE[locale.value] ?? 'en-GB')
  return { locale, dir, date }
}
