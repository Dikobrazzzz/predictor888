import { useState, useEffect, useRef, useCallback } from 'react'
import EventCard from '../components/EventCard'
import BottomNav from '../components/BottomNav'
import { useT } from '../i18n'

const PAGE_SIZE = 5
const RECOMMEND_TOP_N = 5
const RECOMMEND_DAYS = 4

const CYBER_EXCLUDE = ['cyber', 'virtual', '2k', 'blast hockey', 'dream league',
                       'frostball', 'table basketball', 'ipbl', 'subhockey', '3hl', 'rhl', 'mnhl']

const TOP_FOOTBALL_EXACT = new Set([
  // English
  'england. premier league', 'germany. bundesliga', 'spain. la liga',
  'italy. serie a', 'france. ligue 1', 'netherlands. eredivisie',
  'portugal. primeira liga', 'england. championship',
  'germany. 2. bundesliga', 'spain. la liga 2', 'italy. serie b', 'france. ligue 2',
  'russia. premier league', 'turkey. super lig', 'scotland. premiership',
  // Uzbek (approximate API format)
  'angliya. premyer ligasi', 'germaniya. bundesliga', 'ispaniya. la liga',
  'italiya. seriya a', 'fransiya. ligue 1', 'niderlandiya. eredivisie',
  'angliya. chempionship', 'rossiya. premyer ligasi', 'turkiya. super lig',
])
const TOP_FOOTBALL_CONTAINS = [
  'champions league', 'europa league', 'conference league',
  // Uzbek equivalents
  'chempionlar ligasi', 'yevropa ligasi', 'konferensiya ligasi',
  'jahon chempionati', 'millatlar ligasi', 'premyer ligasi',
]

function isTopLiveEvent(event) {
  const league = (event.league || '').toLowerCase()

  if (CYBER_EXCLUDE.some((kw) => league.includes(kw))) return false

  switch (event.sport) {
    case 'Football':
      return TOP_FOOTBALL_EXACT.has(league) ||
             TOP_FOOTBALL_CONTAINS.some((kw) => league.includes(kw))

    case 'Ice Hockey':
      return ['khl', 'kontinental', 'nhl', 'vhl', 'liiga', 'shl'].some((kw) => league.includes(kw))

    case 'Basketball':
      if (league.includes('itf')) return false
      return ['nba', 'euroleague', 'fiba world', 'acb', 'bbl', 'lnb'].some((kw) => league.includes(kw))

    case 'Tennis':
      if (['challenger', 'itf.', 'utr '].some((kw) => league.includes(kw))) return false
      return ['atp.', 'wta.', 'grand slam', 'masters'].some((kw) => league.includes(kw))

    default:
      return true
  }
}

// Stable internal codes — UI labels are resolved via i18n so switching language
// never breaks filtering logic. `sport` matches the canonical English sport name
// from the API; `recKey` matches the recommended-events bucket key.
const SPORT_TABS = [
  { code: 'all',        labelKey: 'events.sportAll',        sport: null,         recKey: null },
  { code: 'football',   labelKey: 'events.sportFootball',   sport: 'Football',   recKey: 'football' },
  { code: 'basketball', labelKey: 'events.sportBasketball', sport: 'Basketball', recKey: 'basketball' },
  { code: 'tennis',     labelKey: 'events.sportTennis',     sport: 'Tennis',     recKey: 'tennis' },
  { code: 'hockey',     labelKey: 'events.sportHockey',     sport: 'Ice Hockey', recKey: 'hockey' },
]

export default function Events({ navigate, allEvents = [], counts: propCounts = {}, recommended = {}, dataReady = false }) {
  const t = useT()
  const [activeSport, setActiveSport] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)
  const observerRef = useRef(null)

  const loading = !dataReady

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeSport])

  const activeTab = SPORT_TABS.find((s) => s.code === activeSport) || SPORT_TABS[0]
  const filtered = activeTab.sport == null
    ? allEvents
    : allEvents.filter((e) => e.sport === activeTab.sport)

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!sentinelRef.current || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE)
        }
      },
      { rootMargin: '80px' }
    )
    observerRef.current.observe(sentinelRef.current)
  }, [hasMore])

  useEffect(() => {
    setupObserver()
    return () => observerRef.current?.disconnect()
  }, [setupObserver])

  const tabCounts = {}
  SPORT_TABS.forEach((tab) => {
    tabCounts[tab.code] = tab.sport == null
      ? allEvents.length
      : allEvents.filter((e) => e.sport === tab.sport).length
  })

  const topUpcoming = (() => {
    if (activeTab.recKey == null) {
      return Object.values(recommended)
        .flat()
        .sort((a, b) => {
          const rank = (tl) => tl?.startsWith('Today') ? 0 : tl?.startsWith('Tomorrow') ? 1 : 2
          return rank(a.timeLeft) - rank(b.timeLeft)
        })
        .slice(0, RECOMMEND_TOP_N)
    }
    return recommended[activeTab.recKey] || []
  })()

  const liveVisible = visible.filter((e) => e.status === 'live' && isTopLiveEvent(e))
  const upcomingVisible = visible.filter((e) => e.status === 'upcoming')

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>

      
      <div style={{ height: '1px', background: '#72777C33' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
        <button
          onClick={() => navigate?.('home')}
          style={{ width: '36px', height: '36px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src="/icons/i_arrowUp.svg" alt="Back" style={{ width: '20px', height: '20px' }} />
        </button>
        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '17px', flex: 1, textAlign: 'center' }}>{t('events.allEvents')}</span>
        <div style={{ width: '36px' }} />
      </div>
      <div style={{ height: '1px', background: '#72777C33', marginBottom: '16px' }} />

      
      <div
        style={{ display: 'flex', gap: '8px', paddingLeft: '20px', paddingRight: '20px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px' }}
        className="scrollbar-hide"
      >
        {SPORT_TABS.map((tab) => {
          const isActive = activeSport === tab.code
          const count = tabCounts[tab.code] || 0
          return (
            <button
              key={tab.code}
              onClick={() => setActiveSport(tab.code)}
              style={{
                flexShrink: 0,
                minWidth: tab.code === 'all' ? '100px' : undefined,
                height: '37px',
                borderRadius: '12px',
                background: isActive ? '#FFFE45' : '#1A1A1A',
                border: 'none',
                color: isActive ? '#000000' : count > 0 ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.25)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                padding: '0 14px',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center' }}>
          {t('events.loadingLive')}
        </div>
      ) : (
        <>
          {liveVisible.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E20000', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('events.liveNow')}</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px' }}>
                  {t('events.matchesCount', { count: filtered.filter(e => e.status === 'live' && isTopLiveEvent(e)).length })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {liveVisible.map((event) => (
                  <EventCard key={event.id} event={event} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          
          {topUpcoming.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E20000', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('events.upcoming')}</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px' }}>
                  {t('events.nextDays', { days: RECOMMEND_DAYS })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topUpcoming.map((event) => (
                  <EventCard key={event.id} event={event} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {upcomingVisible.length > 0 && (
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('events.scheduled')}</span>
                <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px' }}>
                  {t('events.matchesCount', { count: filtered.filter(e => e.status === 'upcoming').length })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingVisible.map((event) => (
                  <EventCard key={event.id} event={event} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '32px', marginBottom: '12px' }}>⚽</div>
              <div style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px', fontWeight: 500 }}>
                {activeTab.sport == null ? t('events.noLiveAll') : t('events.noLiveSport', { sport: t(activeTab.labelKey) })}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '12px', marginTop: '6px' }}>
                {t('events.comeBack')}
              </div>
            </div>
          )}

          
          {hasMore && (
            <div ref={sentinelRef} style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '12px' }}>
                {t('events.loadingMore')}
              </div>
            </div>
          )}
        </>
      )}

      <BottomNav active="events" onNavigate={navigate} />
    </div>
  )
}
