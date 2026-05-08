import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import { apiFetch } from '../utils/api'

const OUTCOME_MAP = { '1': 'home', 'X': 'draw', '2': 'away' }

const OUTCOME_COLORS = {
  '1': '#8FFF37',
  'X': '#FF4D00',
  '2': '#003DD0',
}

const OUTCOME_ACTIVE_BG = {
  '1': 'rgba(143,255,55,0.08)',
  'X': 'rgba(255,77,0,0.08)',
  '2': 'rgba(0,61,208,0.08)',
}

const OUTCOME_ACTIVE_BORDER = {
  '1': 'rgba(143,255,55,0.30)',
  'X': 'rgba(255,77,0,0.30)',
  '2': 'rgba(0,61,208,0.30)',
}

function DrawIcon() {
  return (
    <div style={{
      width: '54px', height: '54px', borderRadius: '50%',
      background: 'rgba(0,0,0,0.39)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M14.8246 10.4653L13.783 11.508L12.9815 12.3095C12.8851 12.4068 12.7703 12.484 12.6438 12.5365C12.5173 12.5891 12.3816 12.616 12.2446 12.6157C12.1076 12.6154 11.9721 12.5878 11.8458 12.5346C11.7196 12.4815 11.6052 12.4038 11.5092 12.306C11.4133 12.2082 11.3377 12.0924 11.2869 11.9652C11.2361 11.8379 11.2111 11.7019 11.2133 11.5649C11.2155 11.428 11.245 11.2928 11.2999 11.1673C11.3548 11.0418 11.4341 10.9285 11.5332 10.8339L13.9153 8.53965C13.9538 8.50278 13.9935 8.4679 14.0343 8.435C14.2952 8.70343 14.4996 9.02144 14.6355 9.37024C14.7713 9.71903 14.8359 10.0915 14.8253 10.4657M20.2048 17.997L19.7288 18.6463C19.472 18.9961 19.1364 19.2806 18.7492 19.4767C18.362 19.6728 17.934 19.775 17.5 19.775L17.1105 20.1645C16.7127 20.5624 16.1806 20.7972 15.6186 20.8227C15.0565 20.8482 14.5053 20.6627 14.0732 20.3025L13.65 19.95L13.4043 20.1957C13.1493 20.4507 12.8466 20.653 12.5134 20.791C12.1802 20.929 11.8231 21 11.4625 21C11.1019 21 10.7448 20.929 10.4116 20.791C10.0784 20.653 9.7757 20.4507 9.5207 20.1957L6.8852 17.5602C6.75519 17.4301 6.60083 17.327 6.43093 17.2566C6.26104 17.1862 6.07895 17.15 5.89505 17.15H1.4V9.45H5.72005C5.90395 9.45001 6.08604 9.41378 6.25593 9.3434C6.42583 9.27302 6.58019 9.16985 6.7102 9.0398L7.92995 7.82005C8.18997 7.56005 8.49865 7.35381 8.83837 7.2131C9.17809 7.0724 9.54219 6.99999 9.9099 7H11.4401C11.7471 7 12.0488 7.0504 12.334 7.14665L10.0765 9.32085C9.77271 9.60666 9.52904 9.95023 9.35975 10.3314C9.19047 10.7126 9.09898 11.1238 9.09065 11.5408C9.08233 11.9578 9.15733 12.3723 9.31127 12.76C9.4652 13.1476 9.69497 13.5006 9.98711 13.7984C10.2792 14.0961 10.6279 14.3325 11.0126 14.4937C11.3972 14.6549 11.8102 14.7377 12.2273 14.7373C12.6444 14.7368 13.0572 14.6531 13.4416 14.491C13.8259 14.329 14.174 14.0918 14.4655 13.7935L14.6118 13.6476L20.1803 17.9784L20.2038 17.9963" fill="#FF4D00"/>
        <path d="M22.28 9.45H26.6V17.15H20.825L14.525 12.25L13.7235 13.0515C13.5292 13.2477 13.2978 13.4034 13.0428 13.5094C12.7878 13.6154 12.5143 13.6697 12.2381 13.6691C11.9619 13.6684 11.6887 13.6129 11.4341 13.5058C11.1796 13.3986 10.9489 13.2419 10.7555 13.0448C10.5621 12.8477 10.4097 12.6141 10.3074 12.3576C10.205 12.1012 10.1546 11.8269 10.1592 11.5508C10.1637 11.2746 10.2231 11.0022 10.3339 10.7492C10.4447 10.4962 10.6047 10.2678 10.8045 10.0772L13.1866 7.78295C13.7085 7.28052 14.4047 6.99988 15.1291 7H18.0901C18.4578 6.99999 18.8219 7.0724 19.1617 7.2131C19.5014 7.35381 19.8101 7.56005 20.0701 7.82005L21.2898 9.0398C21.4198 9.16985 21.5742 9.27302 21.7441 9.3434C21.914 9.41378 22.0961 9.45001 22.28 9.45Z" fill="#FF4D00"/>
      </svg>
    </div>
  )
}

function TeamIcon({ icon, emoji }) {
  if (icon) {
    return (
      <div style={{
        width: '54px', height: '54px', borderRadius: '50%',
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <img src={icon} alt="" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
      </div>
    )
  }
  return (
    <div style={{
      width: '54px', height: '54px', borderRadius: '50%',
      background: '#2A2A2A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: '26px',
    }}>
      {emoji}
    </div>
  )
}

export default function MakePrediction({ event, navigate }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  if (!event) return null

  const { timeLeft, league, home, away, coef } = event

  const baseOutcomes = [
    {
      key: '1',
      title: `1 - ${home.name}`,
      subtitle: 'Home team wins',
      coef: coef.home,
      icon: <TeamIcon icon={home.icon} emoji={home.emoji} />,
    },
    coef.draw != null && coef.draw !== 0
      ? {
          key: 'X',
          title: 'X - Draw',
          subtitle: 'Match ends in draw',
          coef: coef.draw,
          icon: <DrawIcon />,
        }
      : null,
    {
      key: '2',
      title: `2 - ${away.name}`,
      subtitle: 'Away team wins',
      coef: coef.away,
      icon: <TeamIcon icon={away.icon} emoji={away.emoji} />,
    },
  ]
  const outcomes = baseOutcomes.filter(Boolean)

  const handleConfirm = async () => {
    if (!selected || saving || confirmed) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await apiFetch('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({
          event_id: String(event.id),
          sport: event.sport || '',
          league: event.league || '',
          home_team: home?.name || '',
          away_team: away?.name || '',
          outcome: OUTCOME_MAP[selected],
        }),
      })
      if (res.status === 201 || res.ok) {
        setConfirmed(true)
      } else if (res.status === 409) {
        setSaveError('You already made a prediction for this match')
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error || 'Failed to save prediction')
      }
    } catch {
      setSaveError('Network error, please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#131313', paddingBottom: '110px' }}>

      
      {confirmed && (
        <div
          onClick={() => setConfirmed(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '318px',
              height: '237px',
              borderRadius: '24px',
              background: 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)',
              border: '0.68px solid rgba(255,255,255,0.10)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '28px 24px',
              boxSizing: 'border-box',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setConfirmed(false)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img src="/icons/Icon-3.svg" alt="Close" style={{ width: '24px', height: '24px' }} />
            </button>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '20px' }}>
              Congratulations!
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>
              You have successfully registered your forecast.
            </div>
            <button
              onClick={() => navigate?.('home')}
              style={{
                width: '238px',
                height: '48px',
                background: '#E20000',
                borderRadius: '14px',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '16px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              My Prediction
            </button>
          </div>
        </div>
      )}

      
      <div style={{ height: '1px', background: '#72777C33' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
        <button
          onClick={() => navigate?.('events')}
          style={{ width: '36px', height: '36px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src="/icons/i_arrowUp.svg" alt="Back" style={{ width: '20px', height: '20px' }} />
        </button>
        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '17px', flex: 1, textAlign: 'center' }}>Make Prediction</span>
        <button style={{ width: '36px', height: '36px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/icons/i_info.svg" alt="Info" style={{ width: '22px', height: '22px' }} />
        </button>
      </div>
      <div style={{ height: '1px', background: '#72777C33', marginBottom: '20px' }} />

      
      <div style={{ margin: '0 20px 28px', background: '#1A1A1A', borderRadius: '27px', border: '0.68px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            background: '#0285FF4D', border: 'none',
            color: '#6490FF', fontSize: '11px', fontWeight: 600,
            padding: '4px 10px', borderRadius: '20px',
          }}>
            Champions League
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFFE45', fontSize: '11px', fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14" strokeLinecap="round"/>
            </svg>
            {timeLeft}
          </div>
        </div>

        
        <p style={{ color: '#FFFFFF', fontSize: '11px', textAlign: 'center', margin: '0 0 14px' }}>{league}</p>

        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <TeamIcon icon={home.icon} emoji={home.emoji} />
            <span style={{ color: 'rgba(255,255,255,0.24)', fontWeight: 700, fontSize: '36px', letterSpacing: '3px', lineHeight: 1 }}>VS</span>
            <TeamIcon icon={away.icon} emoji={away.emoji} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500, width: '54px', textAlign: 'center' }}>{home.name}</span>
            <span style={{ width: '52px', display: 'inline-block' }} />
            <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500, width: '54px', textAlign: 'center' }}>{away.name}</span>
          </div>
        </div>
      </div>

      
      <div style={{ padding: '0 20px' }}>
        <h2 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '18px', margin: '0 0 16px', textAlign: 'center' }}>
          Choose Your Prediction
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {outcomes.map((o) => {
            const isSelected = selected === o.key
            const color = OUTCOME_COLORS[o.key]
            return (
              <button
                key={o.key}
                onClick={() => !confirmed && setSelected(o.key)}
                disabled={confirmed}
                style={{
                  width: '100%',
                  
                  height: '97px',
                  borderRadius: '27.35px',
                  background: isSelected ? OUTCOME_ACTIVE_BG[o.key] : '#1A1A1A',
                  border: `1px solid ${isSelected ? OUTCOME_ACTIVE_BORDER[o.key] : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 18px',
                  gap: '14px',
                  cursor: confirmed ? 'default' : 'pointer',
                  boxSizing: 'border-box',
                  transition: 'background 0.15s, border 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                  
                  
                }}
              >
                {o.icon}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '15px', lineHeight: 1.3 }}>{o.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.44)', fontWeight: 400, fontSize: '12px', marginTop: '3px' }}>{o.subtitle}</div>
                </div>
                <span style={{ color: isSelected ? color : color, fontWeight: 600, fontSize: '20px', flexShrink: 0 }}>
                  {o.coef}
                </span>
              </button>
            )
          })}
        </div>

        {saveError && (
          <div style={{ color: '#FF4D00', fontSize: '13px', textAlign: 'center', marginBottom: '10px' }}>
            {saveError}
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={saving}
          style={{
            width: '100%', height: '56px', borderRadius: '18px',
            background: selected && !saving ? '#E20000' : '#262626',
            border: 'none',
            color: selected && !saving ? '#FFFFFF' : '#999999',
            fontWeight: 700, fontSize: '16px',
            cursor: selected && !saving ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saving ? 'Saving…' : 'Make Prediction'}
        </button>
      </div>

      <BottomNav active="events" onNavigate={navigate} />
    </div>
  )
}
