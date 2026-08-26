import { useState, useEffect, useRef, useCallback } from 'react'
import Home from './pages/Home'
import Events from './pages/Events'
import MakePrediction from './pages/MakePrediction'
import Rank from './pages/Rank'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import Quests from './pages/Quests'
import TopPicks from './pages/TopPicks'
import Language from './pages/Language'
import TelegramId from './pages/TelegramId'
import parseEvent from './utils/parseEvent'
import { apiFetch, setSession } from './utils/api'

const LS_KEY = 'p888_live_cache'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(events, counts, topEvents, recommended) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ events, counts, topEvents, recommended, ts: Date.now() }))
  } catch {}
}

const LOGIN_KEY = 'p888_logged_in'
const USER_KEY = 'p888_user'
// Birinchi ishga tushirish: Player ID ulanmagan bo'lsa, til tanlash va
// hisobni ulash ekranlari ilovadan oldin ko'rsatiladi.
const PLAYER_KEY = 'p888_player_id'
const LANG_PICKED_KEY = 'p888_lang_picked'

// Временный переключатель на время вёрстки: показывать только экраны секции
// ID_Language (Language → Telegram ID), не пуская дальше в приложение.
// Вернуть обычное поведение — поставить false.
const ONLY_ID_LANGUAGE = false

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(loadUser)
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(LOGIN_KEY) === '1' && loadUser() !== null)
  const [page, setPage] = useState('home')
  const [currentEvent, setCurrentEvent] = useState(null)
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(PLAYER_KEY) || '')
  // При включённом флаге всегда стартуем с выбора языка, игнорируя localStorage.
  const [langPicked, setLangPicked] = useState(() => !ONLY_ID_LANGUAGE && localStorage.getItem(LANG_PICKED_KEY) === '1')

  const handleLangPicked = () => {
    localStorage.setItem(LANG_PICKED_KEY, '1')
    setLangPicked(true)
  }

  const handleLinked = (id) => {
    localStorage.setItem(PLAYER_KEY, id)
    setPlayerId(id)
  }

  const handleLogin = (userData) => {
    localStorage.setItem(LOGIN_KEY, '1')
    setUser(userData)
    setLoggedIn(true)
  }

  const cached = loadFromStorage()
  const [allEvents, setAllEvents] = useState(cached?.events ?? [])
  const [counts, setCounts] = useState(cached?.counts ?? {})
  const [topEvents, setTopEvents] = useState(cached?.topEvents ?? [])
  const [recommended, setRecommended] = useState(() => {
    const raw = cached?.recommended
    if (!raw || typeof raw !== 'object') return {}
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.map(parseEvent) : []]))
  })
  const [dataReady, setDataReady] = useState(cached != null)
  const refreshTimer = useRef(null)

  const fetchLiveData = () => {
    Promise.all([
      fetch('/api/live/all').then(r => r.json()),
      fetch('/api/live/counts').then(r => r.json()),
      fetch('/api/live/home').then(r => r.json()),
      fetch('/api/recommended').then(r => r.json()),
    ]).then(([eventsData, countsData, homeData, recData]) => {
      const parsed = Array.isArray(eventsData) ? eventsData.map(parseEvent) : []
      const cnts = (countsData && typeof countsData === 'object' && !countsData.error) ? countsData : {}
      const top = Array.isArray(homeData) ? homeData.map(parseEvent) : []
      const rec = (recData && typeof recData === 'object' && !recData.error)
        ? Object.fromEntries(Object.entries(recData).map(([k, v]) => [k, Array.isArray(v) ? v.map(parseEvent) : []]))
        : {}
      setAllEvents(parsed)
      setCounts(cnts)
      setTopEvents(top)
      setRecommended(rec)
      setDataReady(true)
      saveToStorage(parsed, cnts, top, rec)
    }).catch(() => setDataReady(true))
  }

  // Отметка визита: источник данных для квеста про серию входов.
  useEffect(() => {
    apiFetch('/api/visit', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchLiveData()
    refreshTimer.current = setInterval(fetchLiveData, 30000)
    return () => clearInterval(refreshTimer.current)
  }, [])

  // Redirect to login when any API call returns 401 (expired token)
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem(LOGIN_KEY)
      setLoggedIn(false)
      setUser(null)
    }
    window.addEventListener('p888:session-expired', onExpired)
    return () => window.removeEventListener('p888:session-expired', onExpired)
  }, [])

  // Refresh user XP/profile every 60s and on tab focus so header stays current
  const refreshUser = useCallback(async () => {
    if (!loggedIn) return
    try {
      const res = await apiFetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        if (data?.id) {
          setUser(prev => {
            if (!prev || prev.points !== data.points || prev.login !== data.login || prev.region !== data.region) {
              setSession(data, null)
              return data
            }
            return prev
          })
        }
      }
    } catch {}
  }, [loggedIn])

  useEffect(() => {
    if (!loggedIn) return
    const timer = setInterval(refreshUser, 60000)
    const onVisible = () => { if (!document.hidden) refreshUser() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loggedIn, refreshUser])

  const navigate = (to, event = null) => {
    if (event) setCurrentEvent(event)
    setPage(to)
  }

  if (ONLY_ID_LANGUAGE || !playerId) {
    if (!langPicked) return <Language onContinue={handleLangPicked} />
    return <TelegramId onLinked={ONLY_ID_LANGUAGE ? () => setLangPicked(false) : handleLinked} />
  }

  if (page === 'events') return <Events navigate={navigate} allEvents={allEvents} counts={counts} recommended={recommended} dataReady={dataReady} />
  if (page === 'makePrediction') return <MakePrediction event={currentEvent} navigate={navigate} />
  if (page === 'rank') return <Rank navigate={navigate} user={user} />
  if (page === 'profile') return <Profile navigate={navigate} user={user} />
  if (page === 'promo') return <Promo navigate={navigate} user={user} />
  if (page === 'quests') return <Quests navigate={navigate} />
  if (page === 'topPicks') return <TopPicks navigate={navigate} />
  if (page === 'language') return <Language navigate={navigate} />
  if (page === 'telegramId') return <TelegramId navigate={navigate} />
  return <Home navigate={navigate} topEvents={topEvents} dataReady={dataReady} user={user} />
}
