import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useT } from '../i18n'

const PICK_LABEL = { home: '1', draw: 'X', away: '2' }
const STATUS_COLOR = { win: '#8FFF37', loss: '#FF4D00', waiting: '#FFFE45' }
const STATUS_LABEL_KEY = { win: 'status.win', loss: 'status.loss', waiting: 'status.waiting' }

export default function TopPlayers({ user }) {
  const t = useT()
  const [tab, setTab] = useState('tournament')
  const [leaderboard, setLeaderboard] = useState([])
  const [predictions, setPredictions] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loadingLb, setLoadingLb] = useState(true)
  const [loadingPreds, setLoadingPreds] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/leaderboard')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setLeaderboard(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingLb(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [predsRes, statsRes] = await Promise.all([
          apiFetch('/api/predictions'),
          apiFetch('/api/leaderboard/me'),
        ])
        if (!cancelled) {
          if (predsRes.ok) setPredictions(await predsRes.json().then(d => Array.isArray(d) ? d : []).catch(() => []))
          if (statsRes.ok) setUserStats(await statsRes.json().catch(() => null))
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoadingPreds(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const position = userStats?.rank > 0 ? `#${userStats.rank}` : '—'
  const totalPoints = userStats?.total_points ?? user?.points ?? 0

  return (
    <div style={{ marginTop: '36px', padding: '0 20px' }}>
      <div style={{ width: '100%', height: '48px', background: '#1A1A1A', borderRadius: '12px', display: 'flex', alignItems: 'center', marginBottom: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <button
          onClick={() => setTab('tournament')}
          style={{ width: '50%', height: '48px', flexShrink: 0, background: tab === 'tournament' ? 'linear-gradient(#262626, #262626) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' : 'transparent', border: '0.7px solid transparent', borderRadius: '12px', color: tab === 'tournament' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          {t('leaderboard.tournament')}
        </button>
        <button
          onClick={() => setTab('my')}
          style={{ width: '50%', height: '48px', background: tab === 'my' ? 'linear-gradient(#262626, #262626) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' : 'transparent', border: '0.7px solid transparent', borderRadius: '12px', color: tab === 'my' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          {t('prediction.myPrediction')}
        </button>
      </div>

      {tab === 'tournament' ? (
        <div style={{ width: '100%', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>{t('leaderboard.topPlayers')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px 6px', padding: '4px 15px', background: 'rgba(0,0,0,0.20)', height: '40px' }}>
            <span style={{ width: '44px', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>#</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>{t('leaderboard.player')}</span>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>{t('common.xp')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: '0 -15px' }}>
            {loadingLb ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('common.loading')}</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('leaderboard.noPlayers')}</div>
            ) : leaderboard.map((entry, idx) => {
              const isMe = entry.user_id === user?.id
              const isLast = idx === leaderboard.length - 1
              const rank = entry.rank > 0 ? entry.rank : idx + 1
              const isFirst = rank === 1
              const nameColor = isMe ? '#FFFE45' : isFirst ? '#FF4D00' : '#FFFFFF'
              const ptsColor = isMe ? '#FFFE45' : isFirst ? '#FF4D00' : '#FFFFFF'

              let circleBg, numColor
              if (rank === 1) {
                circleBg = '#FF4D00'; numColor = '#0E0D0D'
              } else if (rank === 2) {
                circleBg = 'linear-gradient(135deg, #B3BCDA, #5F6474)'; numColor = '#0E0D0D'
              } else if (rank === 3) {
                circleBg = 'linear-gradient(135deg, #9B6D32, #352511)'; numColor = '#0E0D0D'
              } else if (rank === 4) {
                circleBg = '#FFFE45'; numColor = '#0E0D0D'
              } else {
                circleBg = 'rgba(255,255,255,0.10)'; numColor = 'rgba(255,255,255,0.20)'
              }

              return (
                <div key={entry.user_id}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: isMe ? 'rgba(255,254,69,0.05)' : 'transparent',
                    position: 'relative',
                    minHeight: '52px',
                  }}>
                    {isFirst && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0,
                        width: '4px', height: '52px',
                        background: '#FF4D00',
                        borderRadius: '0 2px 2px 0',
                        flexShrink: 0,
                      }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '6px 15px', paddingLeft: isFirst ? '19px' : '15px' }}>
                      <div style={{ width: '44px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: circleBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {rank === 1 ? (
                            <img src="/icons/Icon-4.svg" alt="1st" style={{ width: '16px', height: '16px' }} />
                          ) : (
                            <span style={{ color: numColor, fontSize: '12px', fontWeight: 600 }}>{rank}</span>
                          )}
                        </div>
                      </div>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: nameColor }}>{entry.login}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: ptsColor }}>{entry.total_points}</span>
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          <div style={{
            width: '100%',
            height: '66px',
            borderRadius: '14px',
            marginBottom: '12px',
            boxSizing: 'border-box',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid transparent',
            background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>{t('common.yourPosition')}</div>
                <div style={{ color: '#FFFE45', fontSize: '16px', fontWeight: 700 }}>{loadingPreds ? '…' : position}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>{t('leaderboard.totalPoints')}</div>
                <div style={{ color: '#FFFE45', fontSize: '16px', fontWeight: 700 }}>{loadingPreds ? '…' : totalPoints}</div>
              </div>
            </div>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'rgba(255,254,69,0.05)',
              border: '1px solid rgba(255,254,69,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/icons/Iocn_Tapbar-2.svg" alt="" style={{ width: '22px', height: '22px' }} />
            </div>
          </div>

          <div style={{ width: '100%', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>{t('prediction.myPrediction')}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px 0', padding: '4px 15px', background: 'rgba(0,0,0,0.20)', height: '40px' }}>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>{t('leaderboard.matchCol')}</span>
              <span style={{ width: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>{t('leaderboard.pickCol')}</span>
              <span style={{ width: '50px', textAlign: 'right', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400, marginRight: '4px' }}>{t('common.xp')}</span>
              <span style={{ width: '48px', textAlign: 'right', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>{t('leaderboard.statusCol')}</span>
            </div>

            {loadingPreds ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('common.loading')}</div>
            ) : predictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('common.noPredictions')}</div>
            ) : predictions.slice(0, 10).map((p, idx) => {
              const pick = PICK_LABEL[p.outcome] || p.outcome
              const st = { label: STATUS_LABEL_KEY[p.status] ? t(STATUS_LABEL_KEY[p.status]) : p.status, color: STATUS_COLOR[p.status] || '#888' }
              const xpLabel = p.status === 'win' ? `+${p.points}` : p.status === 'loss' ? '0' : '—'
              const isLast = idx === Math.min(predictions.length, 10) - 1
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', minHeight: '44px' }}>
                    <span style={{ flex: 1, color: '#FFFFFF', fontSize: '12px', fontWeight: 500 }}>
                      {p.home_team} – {p.away_team}
                    </span>
                    <span style={{ width: '40px', textAlign: 'center', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{pick}</span>
                    <span style={{ width: '50px', textAlign: 'right', color: p.status === 'win' ? '#8FFF37' : 'rgba(255,255,255,0.44)', fontSize: '12px', marginRight: '4px' }}>{xpLabel}</span>
                    <span style={{ width: '48px', textAlign: 'right', color: st.color, fontSize: '12px', fontWeight: 600 }}>{st.label}</span>
                  </div>
                  {!isLast && <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 -15px', width: 'calc(100% + 30px)' }} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
