import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, DEFAULT_LANG } from './locales'
import { LANGUAGES, RTL_LANGS } from './languages'

const STORAGE_KEY = 'so_lang'
const I18nContext = createContext(null)

function detectInitial() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved
  const browser = (navigator.language || DEFAULT_LANG).slice(0, 2)
  return LANGUAGES.some(l => l.code === browser) ? browser : DEFAULT_LANG
}

// Ambil nilai bersarang via key bertitik, mis. "top.group.logs".
function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = useCallback((next) => {
    if (LANGUAGES.some(l => l.code === next)) setLangState(next)
  }, [])

  // t('nav.dashboard') atau t('top.noResults', { q: 'foo' }).
  // Bahasa tanpa kamus (atau key yang belum diterjemahkan) jatuh ke Inggris.
  const t = useCallback((key, vars) => {
    let str = lookup(translations[lang], key)
    if (str == null) str = lookup(translations[DEFAULT_LANG], key)
    if (str == null) return key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }
    return str
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
