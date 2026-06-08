import type { Language } from '../data/types'
import { translations } from '../data/translations'

// Stub implementation. Concept §4 — flat array lookup with fallback marker.
export function useI18n(language: Language = 'de') {
  function t(id: string): string {
    const entry = translations.find((e) => e.id === id)
    return entry ? entry[language] : `[missing: ${id}]`
  }
  return { t }
}
