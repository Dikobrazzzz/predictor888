import { useState } from 'react'
import { mockLeaderboard } from '../mockData'

const MY_PREDICTIONS = [
  { date: '08.09', xp: '1000', status: 'Win' },
  { date: '08.09', xp: '1000', status: 'Win' },
  { date: '08.09', xp: '1000', status: 'Win' },
]

export default function TopPlayers() {
  const [tab, setTab] = useState('tournament')

  return (
    <div style={{ marginTop: '36px', padding: '0 20px' }}>
      
      <div style={{ width: '100%', height: '48px', background: '#1A1A1A', borderRadius: '12px', display: 'flex', alignItems: 'center', marginBottom: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <button
          onClick={() => setTab('tournament')}
          style={{ width: '50%', height: '48px', flexShrink: 0, background: tab === 'tournament' ? 'linear-gradient(#262626, #262626) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' : 'transparent', border: '0.7px solid transparent', borderRadius: '12px', color: tab === 'tournament' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          Tournament
        </button>
        <button
          onClick={() => setTab('my')}
          style={{ width: '50%', height: '48px', background: tab === 'my' ? 'linear-gradient(#262626, #262626) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' : 'transparent', border: '0.7px solid transparent', borderRadius: '12px', color: tab === 'my' ? '#FFFE45' : 'rgba(255,255,255,0.32)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent' }}
        >
          My Prediction
        </button>
      </div>

      {tab === 'tournament' ? (
        /* Tournament table — Top Players */
        <div style={{ width: '100%', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>Top Players</span>
            <button style={{ color: '#FFFE45', fontWeight: 400, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View All</button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px 6px', padding: '4px 15px', background: 'rgba(0,0,0,0.20)', height: '40px' }}>
            <span style={{ width: '44px', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>#</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>Player</span>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>XP</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: '0 -15px' }}>
            {mockLeaderboard.map((player, idx) => {
              const isLast = idx === mockLeaderboard.length - 1
              const nameColor = player.isMe ? '#FFFE45' : player.rank === 1 ? '#FF4D00' : '#FFFFFF'
              const ptsColor = player.isMe ? '#FFFE45' : player.rank === 1 ? '#FF4D00' : '#FFFFFF'
              const isFirst = player.rank === 1

              let circleBg, numColor
              if (player.rank === 1) {
                circleBg = '#FF4D00'; numColor = '#0E0D0D'
              } else if (player.rank === 2) {
                circleBg = 'linear-gradient(135deg, #B3BCDA, #5F6474)'; numColor = '#0E0D0D'
              } else if (player.rank === 3) {
                circleBg = 'linear-gradient(135deg, #9B6D32, #352511)'; numColor = '#0E0D0D'
              } else if (player.rank === 4) {
                circleBg = '#FFFE45'; numColor = '#0E0D0D'
              } else {
                circleBg = 'rgba(255,255,255,0.10)'; numColor = 'rgba(255,255,255,0.20)'
              }

              return (
                <div key={player.rank}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: player.isMe ? 'rgba(255,254,69,0.05)' : 'transparent',
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
                          {player.rank === 1 ? (
                            <img src="/icons/Icon-4.svg" alt="1st" style={{ width: '16px', height: '16px' }} />
                          ) : (
                            <span style={{ color: numColor, fontSize: '12px', fontWeight: 600 }}>{player.rank}</span>
                          )}
                        </div>
                      </div>
                      
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: nameColor }}>{player.name}</span>
                      
                      <span style={{ fontSize: '14px', fontWeight: 500, color: ptsColor }}>{player.pts}</span>
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
        /* My Prediction section */
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
                <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>Your position</div>
                <div style={{ color: '#FFFE45', fontSize: '16px', fontWeight: 700 }}>#4</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>Total Points</div>
                <div style={{ color: '#FFFE45', fontSize: '16px', fontWeight: 700 }}>1240</div>
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
              <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>My Prediction</span>
              <button style={{ color: '#FFFE45', fontWeight: 400, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View All</button>
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px 0', padding: '4px 15px', background: 'rgba(0,0,0,0.20)', height: '40px' }}>
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>Date</span>
              <span style={{ width: '60px', textAlign: 'right', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400, marginRight: '8px' }}>XP</span>
              <span style={{ width: '60px', textAlign: 'right', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: 400 }}>Status</span>
            </div>

            
            <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -15px' }}>
              {MY_PREDICTIONS.map((row, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '52px', padding: '6px 15px' }}>
                    <span style={{ flex: 1, color: '#AEAEAE', fontSize: '14px', fontWeight: 400 }}>{row.date}</span>
                    <span style={{ width: '60px', textAlign: 'right', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, marginRight: '8px' }}>{row.xp}</span>
                    <span style={{ width: '60px', textAlign: 'right', color: '#FFFE45', fontSize: '14px', fontWeight: 700 }}>{row.status}</span>
                  </div>
                  {idx < MY_PREDICTIONS.length - 1 && (
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
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
