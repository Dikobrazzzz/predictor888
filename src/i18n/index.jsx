import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import uz from './locales/uz'
import en from './locales/en'
import fr from './locales/fr'
import ar from './locales/ar'
import pt from './locales/pt'
import pl from './locales/pl'

// Til reestri. Yangi til qo'shish uchun:
//   1) ./locales/<code>.js faylini yarating (uz.js kalitlarini tarjima qiling)
//   2) shu yerga import qiling va LANGUAGES ro'yxatiga qo'shing
//   3) RTL til bo'lsa, dir: 'rtl' qo'shing
// Header'dagi flag-tanlagich shu ro'yxatdan avtomatik to'ldiriladi.
export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿', dict: uz },
  { code: 'en', label: 'English',   flag: '🇬🇧', dict: en },
  { code: 'fr', label: 'Français',  flag: '🇫🇷', dict: fr },
  { code: 'ar', label: 'العربية',   flag: '🇸🇦', dict: ar, dir: 'rtl' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', dict: pt },
  { code: 'pl', label: 'Polski',    flag: '🇵🇱', dict: pl },
]

const DICTS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.dict]))
const DEFAULT_LANG = 'uz'
const LANG_KEY = 'p888_lang'

function resolveInitial() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && DICTS[saved]) return saved
  } catch {}
  return DEFAULT_LANG
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(resolveInitial)

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return
    setLangState(code)
    try { localStorage.setItem(LANG_KEY, code) } catch {}
  }, [])

  // Sync <html lang> and text direction (RTL for Arabic etc.) with the active language.
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang)
    const el = document.documentElement
    el.setAttribute('lang', lang)
    el.setAttribute('dir', meta?.dir || 'ltr')
  }, [lang])

  const t = useCallback((key, vars) => {
    const dict = DICTS[lang] || DICTS[DEFAULT_LANG]
    let str = dict[key]
    if (str == null) str = DICTS[DEFAULT_LANG][key]   // fallback to base language
    if (str == null) return key                        // last resort: show the key
    return interpolate(str, vars)
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, setLang, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

// Convenience hook when only the translate function is needed.
export function useT() {
  return useI18n().t
}

// Maps Go time.Format("Mon") output to i18n keys.
const DAY_KEYS = { Mon: 'time.mon', Tue: 'time.tue', Wed: 'time.wed', Thu: 'time.thu', Fri: 'time.fri', Sat: 'time.sat', Sun: 'time.sun' }

// Translates backend-generated time strings (from 888starz API with lng=uz)
// like "LIVE", "Today 14:30", "Mon 14:30", "54 daqiqa o'tdi", "Kechikyapti" etc.
export function localizeTimeLeft(str, t) {
  if (!str) return str
  if (str === 'LIVE') return t('time.live')
  // Backend-generated date prefixes
  if (str.startsWith('Today ')) return t('time.today') + ' ' + str.slice(6)
  if (str.startsWith('Tomorrow ')) return t('time.tomorrow') + ' ' + str.slice(9)
  const day = str.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (.+)$/)
  if (day && DAY_KEYS[day[1]]) return t(DAY_KEYS[day[1]]) + ' ' + day[2]
  // Uzbek API: "54 daqiqa o'tdi, 6 daqiqa qoldi"
  const elapsedLeft = str.match(/^(\d+) daqiqa o['ʻ]tdi,\s*(\d+) daqiqa qoldi$/)
  if (elapsedLeft) return t('time.minutesPassed', { passed: elapsedLeft[1], left: elapsedLeft[2] })
  // Uzbek API: "54 daqiqa o'tdi" (no remaining part) → international "54'"
  const elapsed = str.match(/^(\d+) daqiqa o['ʻ]tdi$/)
  if (elapsed) return `${elapsed[1]}'`
  // Uzbek API: "2 daqiqa qoldi"
  const left = str.match(/^(\d+) daqiqa qoldi$/)
  if (left) return t('time.minutesLeft', { left: left[1] })
  // Uzbek API: "Boshlanishigacha 9 daqiqa"
  const untilStart = str.match(/^Boshlanishigacha (\d+) daqiqa$/)
  if (untilStart) return t('time.untilStart', { mins: untilStart[1] })
  // Uzbek API: status strings
  if (str === 'Kechikyapti') return t('time.delayed')
  if (str === 'Tadbir davom etmoqda') return t('time.inProgress')
  return str
}
