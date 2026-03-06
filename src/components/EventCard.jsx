import { useState } from 'react'

function TeamCircle({ name, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px',  }}>
      <div
        style={{
          width: '54.7px',
          height: '54.7px',
          borderRadius: '27.35px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {icon
          ? <img src={icon} alt={name} style={{ width: '38.29px', height: '38.29px', objectFit: 'contain' }} />
          : <span style={{ fontSize: '24px' }}>🏆</span>
        }
      </div>
      <span style={{
        color: '#FFFFFF',
        fontSize: '11px',
        fontWeight: 500,
        textAlign: 'center',
        lineHeight: '1.3',
        wordBreak: 'break-word',
        width: '100%',
      }}>{name}</span>
    </div>
  )
}

export default function EventCard({ event, onPredict, navigate, forceTopBadge = false }) {
  const [selected, setSelected] = useState(null)

  const { status, timeLeft, league, home, away, coef } = event

  const hasCoef = coef.home != null && coef.home !== 0
  const outcomes = hasCoef ? [
    { key: '1', label: '1', value: coef.home },
    ...(coef.draw != null && coef.draw !== 0 ? [{ key: 'X', label: 'x', value: coef.draw }] : []),
    { key: '2', label: '2', value: coef.away },
  ] : []
  const isTwoWay = outcomes.length === 2

  const handleMakePredict = () => {
    if (navigate) {
      navigate('makePrediction', event)
    } else {
      onPredict?.(event.id, selected)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        backdropFilter: 'blur(61px)',
        borderRadius: '27.35px',
        border: '0.7px solid transparent',
        background: 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)) padding-box, linear-gradient(to top right, #323232B2, #6F6F6FA1) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!forceTopBadge && status === 'live' ? (
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', color: '#E20000', background: '#E200004D' }}>Live bet
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: '#B40E0E', color: '#FFFFFF' }}>Top Event</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#FFFE45' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {timeLeft}
        </div>
      </div>

      
      <p style={{ color: '#FFFFFF', fontSize: '12px', textAlign: 'center', margin: 0 }}>{league}</p>

      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '48px' }}>
        <TeamCircle name={home.name} icon={home.icon} />
        <TeamCircle name={away.name} icon={away.icon} />
      </div>

      
      {outcomes.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '4px',
          ...(isTwoWay && { width: '66.67%', alignSelf: 'center' }),
        }}>
          {outcomes.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected(o.key)}
              style={{
                flex: 1,
                height: '32px',
                borderRadius: '40px',
                background: selected === o.key ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.28)',
                border: selected === o.key ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '0 14px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{o.label}</span>
              <span style={{ color: '#FFFE45', fontWeight: 700, fontSize: '14px' }}>{o.value}</span>
            </button>
          ))}
        </div>
      )}

      
      <button
        onClick={handleMakePredict}
        style={{
          width: '100%',
          height: '42px',
          borderRadius: '12px',
          border: 'none',
          background: '#E20000',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '15px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          marginTop: '4px',
        }}
      >
        Make Prediction
      </button>
    </div>
  )
}
