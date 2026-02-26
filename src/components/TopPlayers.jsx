import { useState } from 'react'
import { mockLeaderboard } from '../mockData'

const AVATAR_COLORS = ['#22c55e', '#a855f7', '#3b82f6', '#f97316', '#ec4899']

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
          style={{ width: '50%', height: '48px', flexShrink: 0, background: tab === 'tournament' ? '#262626' : 'transparent', border: tab === 'tournament' ? '0.74px solid rgba(255,255,255,0.10)' : '0.74px solid transparent', borderRadius: '12px', color: tab === 'tournament' ? '#FFFFFF' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
        >
          Tournament
        </button>
        <button
          onClick={() => setTab('my')}
          style={{ width: '50%', height: '48px', background: tab === 'my' ? '#262626' : 'transparent', border: tab === 'my' ? '0.74px solid rgba(255,255,255,0.10)' : '0.74px solid transparent', borderRadius: '12px', color: tab === 'my' ? '#FFFFFF' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
        >
          My Prediction
        </button>
      </div>

      {/* Table */}
      <div style={{ width: '100%', height: '265px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>Top Players</span>
          <button style={{ color: '#FFFE45', fontWeight: 400, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View All</button>
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', padding: '0 4px' }}>
          <span style={{ width: '32px', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>#</span>
          <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>Player</span>
          <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>PTS</span>
        </div>

        {/* Player rows */}
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
    </div>
  )
}
