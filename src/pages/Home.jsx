import { useState, useEffect } from 'react'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import DailyRewards from '../components/DailyRewards'
import TopPlayers from '../components/TopPlayers'
import BottomNav from '../components/BottomNav'

export default function Home({ navigate, topEvents = [], dataReady = false }) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    setActiveIdx(0)
  }, [allEvents])

  useEffect(() => {
    if (topEvents.length <= 1) return
    const timer = setInterval(() => {
      setActiveIdx(i => (i + 1) % topEvents.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [topEvents.length])

  const currentEvent = topEvents[activeIdx] || null

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>
      <Header />

      <div style={{ padding: '0 20px' }}>
        {!dataReady && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            Loading...
          </div>
        )}
        {dataReady && topEvents.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No live matches right now
          </div>
        )}
        {currentEvent && <EventCard event={currentEvent} navigate={navigate} />}

        {topEvents.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
            {topEvents.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: i === activeIdx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === activeIdx ? '#FFFE45' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.3s, background 0.3s',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <DailyRewards />
      <TopPlayers />

      <BottomNav active="home" onNavigate={navigate} />
    </div>
  )
}
