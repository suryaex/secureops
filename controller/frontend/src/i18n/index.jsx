import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, LANGUAGES, DEFAULT_LANG } from './locales'

const STORAGE_KEY = 'so_lang'
const I18nContext = createContext(null)

function detectInitial() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && translations[saved]) return saved
  const browser = (navigator.language || DEFAULT_LANG).slice(0, 2)
  return translations[browser] ? browser : DEFAULT_LANG
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
  }, [lang])

  const setLang = useCallback((next) => {
    if (translations[next]) setLangState(next)
  }, [])

  // t('nav.dashboard') atau t('top.noResults', { q: 'foo' })
  const t = useCallback((key, vars) => {
    let str = lookup(translations[lang], key)
    if (str == null) str = lookup(translations[DEFAULT_LANG], key) // fallback bahasa default
    if (str == null) return key                                    // fallback terakhir: key mentah
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
