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

const STATUS_COLOR = { win: '#8FFF37', loss: '#FF4D00', waiting: '#FFFE45', void: '#686868' }
const STATUS_LABEL_KEY = { win: 'status.win', loss: 'status.loss', waiting: 'status.waiting', void: 'status.void' }

// component="Vote_Card" (Figma: Property 1=Default / Win / Loss), 343x165.
// Каждый вариант отличается не только тегом: меняются заливка блока результата,
// обводка квадрата, цвет символа пика, яркость названия матча и цвет XP.
const VARIANT = {
  waiting: {
    tagRgb: '255,254,69', tagColor: '#FFFE45',
    title: '#FFFFFF',
    resultBg: '#131313',
    squareBorder: 'rgba(114,119,124,0.2)',
    pick: '#FFFFFF',
    pickValue: '#FFFFFF',
    xp: '#FFFE45',
  },
  win: {
    tagRgb: '143,255,55', tagColor: '#8FFF37',
    title: '#FFFFFF',
    resultBg: 'linear-gradient(90deg, #070A08 0%, #162A18 100%)',
    squareBorder: 'rgba(79,180,0,0.2)',
    pick: '#4FB400',
    pickValue: '#FFFFFF',
    xp: '#8FFF37',
  },
  // Матч без известного счёта: тот же приглушённый блок, что и Loss,
  // но нейтральным серым — исход неизвестен, а не проигран.
  void: {
    tagRgb: '104,104,104', tagColor: '#686868',
    title: 'rgba(255,255,255,0.2)',
    resultBg: '#131313',
    squareBorder: 'rgba(114,119,124,0.2)',
    pick: '#686868',
    pickValue: '#686868',
    xp: '#686868',
  },
  loss: {
    tagRgb: '255,0,0', tagColor: '#FF0000',
    title: 'rgba(255,255,255,0.2)',
    resultBg: '#131313',
    squareBorder: 'rgba(255,0,0,0.2)',
    pick: '#686868',
    pickValue: '#686868',
    xp: '#686868',
  },
}

function PredictionCard({ p }) {
  const t = useT()
  const d = new Date(p.created_at)
  const when = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  const pick = PICK_LABEL[p.outcome] || p.outcome
  const pickLabel = p.outcome === 'draw' ? t('prediction.drawLabel')
    : p.outcome === 'home' ? p.home_team : p.away_team
  const v = VARIANT[p.status] || VARIANT.waiting
  const statusLabel = STATUS_LABEL_KEY[p.status] ? t(STATUS_LABEL_KEY[p.status]) : p.status
  const xpLabel = p.status === 'loss' || p.status === 'void' ? `0 ${t('common.xp')}` : `+ ${p.points} ${t('common.xp')}`
  const winLabel = p.status === 'waiting' ? t('rank.potentialWin') : t('rank.earned')

  return (
    <div style={{
      width: '100%',
      borderRadius: '20px',
      border: '0.7px solid transparent',
      background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
      boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
      padding: '20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            flex: 1,
            minWidth: 0,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 500,
            fontSize: '10px',
            lineHeight: 1.1,
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
          }}>
            {p.league}{'  •  '}{when}
          </span>
          <span style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '36px',
            border: `0.5px solid rgba(${v.tagRgb},0.4)`,
            background: `rgba(${v.tagRgb},0.1)`,
            color: v.tagColor,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 500,
            fontSize: '10px',
            lineHeight: 1.1,
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            gap: '4px',
          }}>
            {p.status === 'waiting' && (
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: v.tagColor }} />
            )}
            {statusLabel}
          </span>
        </div>

        <span style={{ color: v.title, fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: 1.2 }}>
          {p.home_team} <span style={{ color: 'rgba(255,255,255,0.2)' }}>vs</span> {p.away_team}
        </span>
      </div>

      <div style={{
        background: v.resultBg,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <span style={{
          width: '44px',
          height: '44px',
          flexShrink: 0,
          borderRadius: '8px',
          background: 'rgba(27,27,29,0.5)',
          border: `1px solid ${v.squareBorder}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: v.pick,
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '16px',
        }}>
          {pick}
        </span>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ color: '#686868', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', lineHeight: 1.1 }}>{t('rank.yourPick')}</span>
          <span style={{ color: v.pickValue, fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', lineHeight: 1.1 }}>{pickLabel}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span style={{ color: '#686868', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', lineHeight: 1.1 }}>{winLabel}</span>
          <span style={{ color: v.xp, fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: 1.1 }}>{xpLabel}</span>
        </div>
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

  // Ожидающие прогнозы показываем первыми, остальные — по дате убывания.
  const filtered = predictions
    .filter(p => {
      if (activeTab === 'waiting') return p.status === 'waiting'
      if (activeTab === 'finished') return p.status !== 'waiting'
      return true
    })
    .sort((a, b) => {
      const wait = (p) => (p.status === 'waiting' ? 0 : 1)
      if (wait(a) !== wait(b)) return wait(a) - wait(b)
      return new Date(b.created_at) - new Date(a.created_at)
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
            borderRadius: '20px',
            border: '0.7px solid transparent',
            background:
              'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, ' +
              'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
            boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img src="/icons/Icon-5.svg" alt="" style={{ width: '20px', height: '20px' }} />
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('rank.stats')}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1, minWidth: 0, height: '64px',
                borderRadius: '16px',
                border: '1px solid transparent',
                background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                display: 'flex', alignItems: 'center',
                padding: '12px', gap: '8px', boxSizing: 'border-box',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255,254,69,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src="/icons/Iocn_Tapbar-2.svg" alt="" style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: 1.1, marginBottom: '4px' }}>{t('common.yourPosition')}</div>
                  <div style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.1 }}>{loading ? '…' : position}</div>
                </div>
              </div>

              <div style={{
                flex: 1, minWidth: 0, height: '64px',
                borderRadius: '16px',
                border: '1px solid transparent',
                background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                display: 'flex', alignItems: 'center',
                padding: '12px', gap: '8px', boxSizing: 'border-box',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(85,182,133,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src="/icons/Icon_Tapbar-3.svg" alt="" style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: 1.1, marginBottom: '4px' }}>{t('common.winRate')}</div>
                  <div style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.1 }}>{loading ? '…' : winRate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: '0 -20px 28px' }}>
          <DailyRewards pill={t('promo.new', { count: 3 })} />
        </div>

        <div>
          <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            <img src="/icons/Vector-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>{t('prediction.myPrediction')}</span>
          </div>

          <div style={{
            width: '100%',
            height: '48px',
            background: '#1B1B1D',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
            marginBottom: '12px',
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
                    borderRadius: '12px',
                    background: isActive ? 'linear-gradient(#2D2D2F, #2D2D2F) padding-box, linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%) border-box' : 'transparent',
                    border: '0.7px solid transparent',
                    color: isActive ? '#FFFE45' : 'rgba(255,255,255,0.2)',
                    fontFamily: 'Roboto Flex, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
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
