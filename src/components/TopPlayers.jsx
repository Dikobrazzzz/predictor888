import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useT } from '../i18n'

const PICK_LABEL = { home: '1', draw: 'X', away: '2' }
const STATUS_COLOR = { win: '#8FFF37', loss: '#FF4D00', waiting: '#FFFE45' }
const VIEW_ALL = {
  background: 'none', border: 'none', padding: 0,
  color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 400,
  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
}

const STATUS_LABEL_KEY = { win: 'status.win', loss: 'status.loss', waiting: 'status.waiting' }

// В макете колонка Date в формате ДД.ММ («08.09»).
function formatPredDate(p) {
  const raw = p.created_at
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function TopPlayers({ user, navigate }) {
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
        <div style={{ width: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', border: '1px solid transparent', background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '45px', padding: '16px 20px', boxSizing: 'border-box' }}>
            <span style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '12px' }}>{t('leaderboard.topPlayers')}</span>
            <button onClick={() => navigate?.('rank')} style={VIEW_ALL}>{t('leaderboard.viewAll')}</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'rgba(0,0,0,0.2)', height: '40px', boxSizing: 'border-box' }}>
            <span style={{ width: '48px', color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400 }}>#</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400 }}>{t('leaderboard.player')}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400, textAlign: 'right' }}>{t('common.xp')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                    {/* Полоса первого места лежит поверх ряда и не сдвигает содержимое:
                        в макете аватар каждого ряда стоит на x=20 от края таблицы. */}
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '12px 20px', boxSizing: 'border-box' }}>
                      <div style={{ width: '48px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
                      <span style={{ flex: 1, fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 700, color: nameColor }}>{entry.login}</span>
                      <span style={{ fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 700, color: ptsColor, textAlign: 'right' }}>{entry.total_points}</span>
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{ width: '100%', height: '1px', background: 'rgba(114,119,124,0.2)' }} />
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
            borderRadius: '16px',
            marginBottom: '12px',
            boxSizing: 'border-box',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid transparent',
            background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          }}>
            {/* В макете у ряда just=SPACE_EVENLY: обе колонки и иконка разнесены
                по всей ширине, поэтому Total Points приходится на середину. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: 1.1 }}>{t('common.yourPosition')}</div>
              <div style={{ color: '#FFFE45', fontFamily: 'Roboto, sans-serif', fontSize: '22.5px', fontWeight: 600, lineHeight: '21.8px' }}>{loadingPreds ? '…' : position}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: 1.1 }}>{t('leaderboard.totalPoints')}</div>
              <div style={{ color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.1 }}>{loadingPreds ? '…' : totalPoints}</div>
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

          <div style={{ width: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', border: '1px solid transparent', background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '45px', padding: '16px 20px', boxSizing: 'border-box' }}>
              <span style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '12px' }}>{t('prediction.myPrediction')}</span>
              <button onClick={() => navigate?.('rank')} style={VIEW_ALL}>{t('leaderboard.viewAll')}</button>
            </div>

            {/* Колонки в макете: Date | XP | Status (порядковый номер скрыт) */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'rgba(0,0,0,0.2)', height: '40px', boxSizing: 'border-box' }}>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 700 }}>{t('leaderboard.dateCol')}</span>
              <span style={{ width: '60px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 700 }}>{t('common.xp')}</span>
              <span style={{ width: '90px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', fontWeight: 700 }}>{t('leaderboard.statusCol')}</span>
            </div>

            {loadingPreds ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('common.loading')}</div>
            ) : predictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>{t('common.noPredictions')}</div>
            ) : predictions.slice(0, 10).map((p, idx) => {
              const st ={ label: STATUS_LABEL_KEY[p.status] ? t(STATUS_LABEL_KEY[p.status]) : p.status, color: STATUS_COLOR[p.status] || '#888' }
              const xpLabel = p.status === 'win' ? `${p.points}` : p.status === 'loss' ? '0' : '—'
              const isLast = idx === Math.min(predictions.length, 10) - 1
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', minHeight: '51px', boxSizing: 'border-box' }}>
                    <span style={{ flex: 1, color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400 }}>
                      {formatPredDate(p)}
                    </span>
                    <span style={{ width: '60px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px' }}>{xpLabel}</span>
                    <span style={{ width: '90px', textAlign: 'right', color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif', fontSize: '14px', fontWeight: 400 }}>{st.label}</span>
                  </div>
                  {!isLast && <div style={{ width: '100%', height: '1px', background: 'rgba(114,119,124,0.2)' }} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
