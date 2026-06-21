import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import DailyRewards from '../components/DailyRewards'
import { useT } from '../i18n'
import { apiFetch } from '../utils/api'

const TABS = [
  { code: 'all',      labelKey: 'rank.tabAll' },
  { code: 'waiting',  labelKey: 'common.active' },
  { code: 'finished', labelKey: 'rank.tabFinished' },
]

const PICK_LABEL = { home: '1', draw: 'X', away: '2' }

const STATUS_COLOR = { win: '#8FFF37', loss: '#FF4D00', waiting: '#FFFE45' }
const STATUS_LABEL_KEY = { win: 'status.win', loss: 'status.loss', waiting: 'status.waiting' }

function PredictionCard({ p }) {
  const t = useT()
  const d = new Date(p.created_at)
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  const pick = PICK_LABEL[p.outcome] || p.outcome
  const st = { label: STATUS_LABEL_KEY[p.status] ? t(STATUS_LABEL_KEY[p.status]) : p.status, color: STATUS_COLOR[p.status] || '#888' }
  const xpLabel = p.status === 'win' ? `+${p.points} ${t('common.xp')}` : p.status === 'loss' ? `0 ${t('common.xp')}` : '—'

  return (
    <div style={{
      width: '100%',
      borderRadius: '14px',
      border: '1px solid transparent',
      background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
      padding: '12px 14px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.44)', fontSize: '11px' }}>{date}</span>
        <span style={{ color: st.color, fontSize: '12px', fontWeight: 600 }}>{st.label}</span>
      </div>
      <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>
        {p.home_team} vs {p.away_team}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.44)', fontSize: '12px' }}>
          {p.league} · {t('rank.pick')} <span style={{ color: '#FFFFFF' }}>{pick}</span>
        </span>
        <span style={{ color: p.status === 'win' ? '#8FFF37' : 'rgba(255,255,255,0.44)', fontSize: '12px', fontWeight: 600 }}>
          {xpLabel}
        </span>
      </div>
    </div>
  )
}

export default function Rank({ navigate, user }) {
  const t = useT()
  const [activeTab, setActiveTab] = useState('all')
  const [predictions, setPredictions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [predsRes, statsRes] = await Promise.all([
          apiFetch('/api/predictions'),
          apiFetch('/api/leaderboard/me'),
        ])
        if (!cancelled) {
          if (predsRes.ok) {
            const data = await predsRes.json()
            setPredictions(Array.isArray(data) ? data : [])
          }
          if (statsRes.ok) {
            const data = await statsRes.json()
            setStats(data)
          }
        }
      } catch {
        // silently ignore network errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = predictions.filter(p => {
    if (activeTab === 'waiting') return p.status === 'waiting'
    if (activeTab === 'finished') return p.status !== 'waiting'
    return true
  })

  const position = stats?.rank > 0 ? `#${stats.rank}` : '—'
  const total = (stats?.wins ?? 0) + (stats?.losses ?? 0)
  const winRate = total > 0 ? `${Math.round((stats.wins / total) * 100)}%` : '—'

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

      <div style={{ padding: '0 20px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{
            width: '100%',
            borderRadius: '18px',
            border: '0.68px solid #BDBDBD0F',
            background: 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)',
            backdropFilter: 'blur(61.41px)',
            WebkitBackdropFilter: 'blur(61.41px)',
            padding: '20px 16px',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <img src="/icons/Icon-5.svg" alt="" style={{ width: '20px', height: '20px' }} />
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('rank.stats')}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '147px', height: '64px', flexShrink: 0,
                borderRadius: '10px',
                border: '1px solid transparent',
                background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                display: 'flex', alignItems: 'center',
                padding: '0 10px', gap: '8px', boxSizing: 'border-box',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(131,137,44,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src="/icons/Iocn_Tapbar-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>{t('common.yourPosition')}</div>
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>{loading ? '…' : position}</div>
                </div>
              </div>

              <div style={{
                width: '147px', height: '64px', flexShrink: 0,
                borderRadius: '10px',
                border: '1px solid transparent',
                background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                display: 'flex', alignItems: 'center',
                padding: '0 10px', gap: '8px', boxSizing: 'border-box',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#1C3B2C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src="/icons/Icon_Tapbar-3.svg" alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>{t('common.winRate')}</div>
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>{loading ? '…' : winRate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: '0 -20px 28px' }}>
          <DailyRewards />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src="/icons/Vector-2.svg" alt="" style={{ width: '18px', height: '18px' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('prediction.myPrediction')}</span>
          </div>

          <div style={{
            width: '100%',
            height: '40px',
            background: '#1A1A1A',
            borderRadius: '9.64px',
            display: 'flex',
            alignItems: 'center',
            padding: '3px',
            boxSizing: 'border-box',
            marginBottom: '14px',
          }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.code
              return (
                <button
                  key={tab.code}
                  onClick={() => setActiveTab(tab.code)}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: '7px',
                    background: isActive ? 'linear-gradient(#262626, #262626) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' : 'transparent',
                    border: isActive ? '0.7px solid transparent' : '0.7px solid transparent',
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.32)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {t(tab.labelKey)}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>
                {t('common.loading')}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>
                {t('common.noPredictions')}
              </div>
            ) : (
              filtered.map(p => <PredictionCard key={p.id} p={p} />)
            )}
          </div>

          <button
            onClick={() => navigate?.('events')}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '18px',
              background: '#E20000',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {t('rank.newPrediction')}
          </button>
        </div>

      </div>

      <BottomNav active="rank" onNavigate={navigate} />
    </div>
  )
}
