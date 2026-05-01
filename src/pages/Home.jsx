import Header from '../components/Header'
import EventCard from '../components/EventCard'
import DailyRewards from '../components/DailyRewards'
import TopPlayers from '../components/TopPlayers'
import BottomNav from '../components/BottomNav'

export default function Home({ navigate, topEvents = [], dataReady = false, user }) {
  const currentEvent = topEvents[0] || null

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

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
        {currentEvent && <EventCard event={currentEvent} navigate={navigate} forceTopBadge />}
      </div>

      <DailyRewards />
      <TopPlayers user={user} />

      <BottomNav active="home" onNavigate={navigate} />
    </div>
  )
}
