import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { apiFetch } from '../utils/api'
import BottomNav from '../components/BottomNav'
import iconTapbar from '/icons/Icon_Tapbar.svg'
import iconPosition from '/icons/Iocn_Tapbar-2.svg'
import iconWinrate from '/icons/Icon_Tapbar-3.svg'
import iconEmail from '/icons/Icon.svg'
import iconLocation from '/icons/basil_location-solid.svg'
import iconEdit from '/icons/tdesign_edit-filled.svg'
import iconTelegram from '/icons/Telegram.svg'
import iconGroup from '/icons/Group-2.svg'
import iconLogout from '/icons/cuida_logout-outline.svg'

const CARD_GRADIENT = 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)'

function InfoRow({ icon, label, value, valueColor = '#FFFFFF', rightSlot, valuePrefix }) {
  return (
    <div style={{
      height: '68px',
      background: '#131313',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '12px',
      boxSizing: 'border-box',
    }}>
      
      <div style={{
        width: '44px',
        height: '44px',
        background: '#1B1B1D',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={icon} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
      </div>

      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ color: '#686868', fontSize: '11px', fontWeight: 400, marginBottom: '3px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {valuePrefix}
          <span style={{ color: valueColor, fontSize: '14px', fontWeight: 400 }}>{value}</span>
        </div>
      </div>

      
      {rightSlot}
    </div>
  )
}

export default function Profile({ navigate, user }) {
  const [subscribed, setSubscribed] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/leaderboard/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setStats(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const position = stats?.rank > 0 ? `#${stats.rank}` : '—'
  const total = (stats?.wins ?? 0) + (stats?.losses ?? 0)
  const winRate = total > 0 ? `${Math.round((stats.wins / total) * 100)}%` : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

      <div style={{ padding: '0 20px' }}>
        <div style={{
          width: '100%',
          borderRadius: '18px',
          border: '0.68px solid #BDBDBD0F',
          background: CARD_GRADIENT,
          backdropFilter: 'blur(61.41px)',
          WebkitBackdropFilter: 'blur(61.41px)',
          padding: '14px 16px',
          boxSizing: 'border-box',
        }}>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src={iconTapbar} alt="" style={{ width: '20px', height: '20px' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Profil ma'lumotlari</span>
          </div>

          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '147px', height: '64px', borderRadius: '10px',
              border: '1px solid transparent',
              background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
              display: 'flex', alignItems: 'center',
              padding: '0 10px', gap: '8px', boxSizing: 'border-box', flexShrink: 0,
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(131,137,44,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={iconPosition} alt="" style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: 400, marginBottom: '2px' }}>Sizning o'rningiz</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>{position}</div>
              </div>
            </div>

            <div style={{
              width: '147px', height: '64px', borderRadius: '10px',
              border: '1px solid transparent',
              background: 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
              display: 'flex', alignItems: 'center',
              padding: '0 10px', gap: '8px', boxSizing: 'border-box', flexShrink: 0,
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1C3B2C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={iconWinrate} alt="" style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: 400, marginBottom: '2px' }}>G'alaba foizi</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>{winRate}</div>
              </div>
            </div>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <InfoRow
              icon={iconEmail}
              label="Email"
              value={user?.email || '—'}
            />

            <InfoRow
              icon={iconLocation}
              label="Hudud"
              value={user?.region || '—'}
              rightSlot={
                <img src={iconEdit} alt="" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              }
            />

            <InfoRow
              icon={iconTelegram}
              label="Obuna"
              value={subscribed ? 'Faol' : 'Nofaol'}
              valueColor={subscribed ? '#55B685' : '#FF4D00'}
              valuePrefix={subscribed ? (
                <img src={iconGroup} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              ) : null}
              rightSlot={subscribed ? null : (
                <button
                  onClick={() => setSubscribed(true)}
                  style={{
                    width: '98px',
                    height: '29px',
                    background: '#FFFE45',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#0E0D0D',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  Obuna bo'lish
                </button>
              )}
            />

            <InfoRow
              icon={iconLogout}
              label="Botni o'chirish"
              value=""
              rightSlot={
                <button style={{
                  width: '77px',
                  height: '29px',
                  background: '#555555',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#0E0D0D',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  O'chirish
                </button>
              }
            />

          </div>
        </div>
      </div>

      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  )
}
