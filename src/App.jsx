import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home'
import Events from './pages/Events'
import MakePrediction from './pages/MakePrediction'
import Rank from './pages/Rank'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import Welcome from './pages/Welcome'
import Telegram from './pages/Telegram'
import Login from './pages/Login'
import parseEvent from './utils/parseEvent'

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

const AUTH_KEY = 'p888_authenticated'
const ONBOARD_KEY = 'p888_onboarded'
const LOGIN_KEY = 'p888_logged_in'
const USER_KEY = 'p888_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === '1')
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARD_KEY) === '1')
  const [user, setUser] = useState(loadUser)
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(LOGIN_KEY) === '1' && loadUser() !== null)
  const [page, setPage] = useState('home')
  const [currentEvent, setCurrentEvent] = useState(null)

  const handleStart = () => {
    localStorage.setItem(AUTH_KEY, '1')
    setAuthenticated(true)
  }

  const handleTelegramSubscribe = () => {
    localStorage.setItem(ONBOARD_KEY, '1')
    setOnboarded(true)
  }

  const handleTelegramSkip = () => {
    localStorage.setItem(ONBOARD_KEY, '1')
    setOnboarded(true)
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

  useEffect(() => {
    fetchLiveData()
    refreshTimer.current = setInterval(fetchLiveData, 30000)
    return () => clearInterval(refreshTimer.current)
  }, [])

  const navigate = (to, event = null) => {
    if (event) setCurrentEvent(event)
    setPage(to)
  }

  if (!authenticated) return <Welcome onStart={handleStart} />
  if (!onboarded) return <Telegram onSubscribe={handleTelegramSubscribe} onSkip={handleTelegramSkip} />
  if (!loggedIn) return <Login onLogin={handleLogin} />

  if (page === 'events') return <Events navigate={navigate} allEvents={allEvents} counts={counts} recommended={recommended} dataReady={dataReady} />
  if (page === 'makePrediction') return <MakePrediction event={currentEvent} navigate={navigate} />
  if (page === 'rank') return <Rank navigate={navigate} />
  if (page === 'profile') return <Profile navigate={navigate} />
  if (page === 'promo') return <Promo navigate={navigate} />
  return <Home navigate={navigate} topEvents={topEvents} dataReady={dataReady} />
}
