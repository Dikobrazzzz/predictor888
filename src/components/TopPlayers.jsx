import { useState } from 'react'
import { mockLeaderboard } from '../mockData'

const AVATAR_COLORS = ['#22c55e', '#a855f7', '#3b82f6', '#f97316', '#ec4899']

const MY_PREDICTIONS = [
  { date: '08.09', xp: '1000', status: 'Win' },
  { date: '08.09', xp: '1000', status: 'Win' },
  { date: '08.09', xp: '1000', status: 'Win' },
]

function PlayerAvatar({ name, color }) {
  return (
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function TopPlayers() {
  const [tab, setTab] = useState('tournament')

  return (
    <div style={{ marginTop: '36px', padding: '0 20px' }}>
      {/* Segmented tabs */}
      <div style={{ width: '100%', height: '48px', background: '#1A1A1A', borderRadius: '12px', display: 'flex', alignItems: 'center', marginBottom: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <button
          onClick={() => setTab('tournament')}
          style={{ width: '50%', height: '48px', flexShrink: 0, background: tab === 'tournament' ? '#262626' : 'transparent', border: tab === 'tournament' ? '0.74px solid rgba(255,255,255,0.10)' : '0.74px solid transparent', borderRadius: '12px', color: tab === 'tournament' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          Tournament
        </button>
        <button
          onClick={() => setTab('my')}
          style={{ width: '50%', height: '48px', background: tab === 'my' ? '#262626' : 'transparent', border: tab === 'my' ? '0.74px solid rgba(255,255,255,0.10)' : '0.74px solid transparent', borderRadius: '12px', color: tab === 'my' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          My Prediction
        </button>
      </div>

      {tab === 'tournament' ? (
        /* Tournament table — Top Players */
        <div style={{ width: '100%', height: '265px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>Top Players</span>
            <button style={{ color: '#FFFE45', fontWeight: 400, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View All</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', padding: '0 4px' }}>
            <span style={{ width: '32px', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>#</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>Player</span>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>PTS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {mockLeaderboard.map((player, idx) => {
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const isFirst = player.rank === 1
              const isLast = idx === mockLeaderboard.length - 1
              let nameColor = 'rgba(255,255,255,0.30)'
              let ptsColor = 'rgba(255,255,255,0.30)'
              if (isFirst) { nameColor = '#FF4D00'; ptsColor = '#FF4D00' }
              if (player.isMe) { nameColor = '#FFFFFF'; ptsColor = '#FFFFFF' }
              return (
                <div key={player.rank}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '6px 4px' }}>
                    <div style={{ width: '32px', display: 'flex', alignItems: 'center' }}>
                      {isFirst ? (
                        <img src="/icons/i_games.svg" alt="crown" style={{ width: '20px', height: '20px' }} />
                      ) : (
                        <span style={{ color: player.isMe ? '#FFFE45' : 'rgba(255,255,255,0.42)', fontSize: '13px', fontWeight: 400 }}>{player.rank}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      {player.isMe ? (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #fb923c, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>Y</div>
                      ) : (
                        <PlayerAvatar name={player.name} color={avatarColor} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 500, color: nameColor }}>{player.name}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: ptsColor }}>{player.pts}</span>
                  </div>
                  {!isLast && (
                    <div style={{ width: '91%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 auto' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* My Prediction section */
        <>
          {/* Info rectangle between tabs and table */}
          <div style={{
            width: '100%',
            height: '66px',
            background: '#1B1B1D',
            borderRadius: '14px',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }} />

          {/* My Prediction table */}
          <div style={{ width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>My Prediction</span>
            </div>

            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', padding: '0 4px' }}>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.20)', fontSize: '12px', fontWeight: 400 }}>Date</span>
              <span style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.20)', fontSize: '12px', fontWeight: 400 }}>XP</span>
              <span style={{ flex: 1, textAlign: 'right', color: 'rgba(255,255,255,0.20)', fontSize: '12px', fontWeight: 400 }}>Status</span>
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {MY_PREDICTIONS.map((row, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 4px' }}>
                    <span style={{ flex: 1, color: '#AEAEAE', fontSize: '14px', fontWeight: 400 }}>{row.date}</span>
                    <span style={{ flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>{row.xp}</span>
                    <span style={{ flex: 1, textAlign: 'right', color: '#FFFE45', fontSize: '14px', fontWeight: 700 }}>{row.status}</span>
                  </div>
                  {idx < MY_PREDICTIONS.length - 1 && (
                    <div style={{ width: '91%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 auto' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
