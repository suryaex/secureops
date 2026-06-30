import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import Flag from './Flag'

// Tombol pemilih bahasa untuk TopBar (dropdown ringkas dengan bendera).
export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const current = languages.find(l => l.code === lang) || languages[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 w-9 h-9 justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
        title={t('settings.language')}
        aria-label={t('settings.language')}
      >
        <span className="material-symbols-outlined text-xl">translate</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg overflow-y-auto max-h-[70vh] z-30">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                l.code === current.code ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'
              }`}
            >
              <Flag flag={l.flag} />
              <span className="flex-1">{l.label}</span>
              {l.code === current.code && (
                <span className="material-symbols-outlined text-primary text-base">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
