import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home'
import Events from './pages/Events'
import MakePrediction from './pages/MakePrediction'
import Rank from './pages/Rank'

const LS_KEY = 'p888_live_cache'

function parseEvent(d) {
  return {
    id: d.id,
    status: d.status || 'live',
    timeLeft: d.timeLeft || 'LIVE',
    league: d.league || '',
    home: { name: d.home, icon: d.homeIcon || null },
    away: { name: d.away, icon: d.awayIcon || null },
    score: d.score || null,
    sport: d.sport || '',
    coef: {
      home: d.coef?.home ?? 0,
      draw: d.coef?.draw ?? 0,
      away: d.coef?.away ?? 0,
    },
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(events, counts) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ events, counts, ts: Date.now() }))
  } catch {}
}

export default function App() {
  const [page, setPage] = useState('home')
  const [currentEvent, setCurrentEvent] = useState(null)

  // Load cached data immediately from localStorage (no loading spinner on revisit)
  const cached = loadFromStorage()
  const [allEvents, setAllEvents] = useState(cached?.events ?? [])
  const [counts, setCounts] = useState(cached?.counts ?? {})
  const [dataReady, setDataReady] = useState(cached != null)
  const refreshTimer = useRef(null)

  const fetchLiveData = () => {
    Promise.all([
      fetch('/api/live/all').then(r => r.json()),
      fetch('/api/live/counts').then(r => r.json()),
    ]).then(([eventsData, countsData]) => {
      const parsed = Array.isArray(eventsData) ? eventsData.map(parseEvent) : []
      const cnts = (countsData && typeof countsData === 'object' && !countsData.error) ? countsData : {}
      setAllEvents(parsed)
      setCounts(cnts)
      setDataReady(true)
      saveToStorage(parsed, cnts)
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

  if (page === 'events') return <Events navigate={navigate} allEvents={allEvents} counts={counts} dataReady={dataReady} />
  if (page === 'makePrediction') return <MakePrediction event={currentEvent} navigate={navigate} />
  if (page === 'rank') return <Rank navigate={navigate} />
  return <Home navigate={navigate} allEvents={allEvents} dataReady={dataReady} />
}
