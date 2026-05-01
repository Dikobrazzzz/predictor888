import { useState } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import DailyRewards from '../components/DailyRewards'

const TABS = ['All', 'Active', 'Finished']

export default function Rank({ navigate, user }) {
  const [activeTab, setActiveTab] = useState('All')

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
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Profile Statistics</span>
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
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>—</div>
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
                  <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>—</div>
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.30)', fontSize: '14px' }}>
              No predictions yet
            </div>
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
