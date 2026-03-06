import { useState } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import DailyRewards from '../components/DailyRewards'

const mockPredictions = [
  {
    id: 1,
    league: 'PREMIER LEAGUE',
    time: 'TODAY 20:45',
    home: 'Newcastle',
    away: 'Man City',
    score: null,
    pick: 'X',
    pickLabel: 'Draw',
    status: 'waiting',
    xp: 450,
  },
  {
    id: 2,
    league: 'LA LIGA',
    time: 'YESTERDAY',
    home: 'Real Madrid',
    away: 'Sevilla',
    score: '3-1',
    pick: '1',
    pickLabel: 'Home win',
    status: 'win',
    xp: 450,
  },
  {
    id: 3,
    league: 'SERIE A',
    time: '2 DAYS AGO',
    home: 'Juventus',
    away: 'Napoli',
    score: '0-1',
    pick: '1',
    pickLabel: 'Home win',
    status: 'loss',
    xp: 0,
  },
]

const STATUS_CONFIG = {
  waiting: { label: 'WAITING', color: '#FFFE45', bg: 'rgba(255,254,69,0.12)', dot: '#FFFE45' },
  win:     { label: 'WIN',     color: '#55FF45', bg: 'rgba(85,255,69,0.12)',  dot: '#55FF45' },
  loss:    { label: 'LOSS',    color: '#FF4545', bg: 'rgba(255,69,69,0.12)',  dot: '#FF4545' },
}

const TABS = ['All', 'Active', 'Finished']

function PredictionCard({ p }) {
  const cfg = STATUS_CONFIG[p.status]

  return (
    <div style={{
      width: '100%',
      minHeight: '163px',
      background: 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)',
      borderRadius: '18px',
      border: '0.68px solid rgba(255,255,255,0.08)',
      padding: '14px 16px',
      boxSizing: 'border-box',
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: 'rgba(255,255,255,0.53)', fontSize: '10px', fontWeight: 400, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {p.league}&nbsp;•&nbsp;{p.time}
        </span>
        <span style={{
          color: cfg.color, fontSize: '10px', fontWeight: 400,
          background: cfg.bg, borderRadius: '20px', padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {p.status === 'waiting' && (
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFFE45', flexShrink: 0, display: 'inline-block' }} />
          )}
          {cfg.label}
        </span>
      </div>

      
      <div style={{ marginBottom: '10px', fontSize: '16px', lineHeight: 1.3 }}>
        {p.score ? (
          <>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{p.home}</span>
            <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 700, margin: '0 6px' }}>{p.score}</span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{p.away}</span>
          </>
        ) : (
          <>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{p.home}</span>
            <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}> vs </span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{p.away}</span>
          </>
        )}
      </div>

      
      <div style={{
        background: p.status === 'win'
          ? 'linear-gradient(90deg, #060706 0%, #182D1A 100%)'
          : '#131313',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: p.status === 'loss' ? '#241E1E' : p.status === 'win' ? '#1E242069' : '#1A1A1A',
            border: p.status === 'loss' ? '1px solid #8D19193D' : p.status === 'win' ? '1px solid #38C33840' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: p.status === 'win' ? '#31AA36' : '#FFFFFF', fontWeight: 700, fontSize: '14px', 
          }}>
            {p.pick}
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '10px', fontWeight: 400 }}>Your Pick</div>
            <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{p.pickLabel}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '10px', fontWeight: 400 }}>
            {p.status === 'waiting' ? 'Potential Win' : p.status === 'win' ? 'Earned' : 'Result'}
          </div>
          <div style={{ color: p.status === 'loss' ? 'rgba(255,255,255,0.50)' : p.status === 'win' ? '#45FF4B' : '#FFFE45', fontSize: '14px', fontWeight: 600 }}>
            {p.status === 'loss' ? '0 XP' : `+ ${p.xp} XP`}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Rank({ navigate }) {
  const [activeTab, setActiveTab] = useState('All')

  const filtered = mockPredictions.filter((p) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return p.status === 'waiting'
    if (activeTab === 'Finished') return p.status !== 'waiting'
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>
      <Header />

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
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Profile Statistick</span>
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
                  <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Your Position</div>
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>#37</div>
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
                  <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Win rate</div>
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>68%</div>
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
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>My Prediction</span>
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
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
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
                  {tab}
                </button>
              )
            })}
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {filtered.map((p) => <PredictionCard key={p.id} p={p} />)}
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
            Make New Prediction
          </button>
        </div>

      </div>

      <BottomNav active="rank" onNavigate={navigate} />
    </div>
  )
}
