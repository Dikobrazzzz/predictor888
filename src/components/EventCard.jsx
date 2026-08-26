import { useState } from 'react'
import { useT, localizeTimeLeft } from '../i18n'

// Team 54x69 в макете: круг 54, gap 4, подпись 10px #AEAEAE по центру.
function TeamCircle({ name, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '54px' }}>
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '60px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {icon
          ? <img src={icon} alt={name} style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          : <span style={{ fontSize: '24px' }}>🏆</span>
        }
      </div>
      <span style={{
        color: '#AEAEAE',
        fontFamily: 'Roboto Flex, sans-serif',
        fontSize: '10px',
        fontWeight: 400,
        lineHeight: 1.1,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>{name}</span>
    </div>
  )
}

export default function EventCard({ event, onPredict, navigate, forceTopBadge = false }) {
  const t = useT()
  const [selected, setSelected] = useState(null)

  const { status, timeLeft: rawTimeLeft, league, home, away, coef } = event
  const timeLeft = localizeTimeLeft(rawTimeLeft, t)

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
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)',
        borderRadius: '28px',
        border: '0.7px solid transparent',
        background: 'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
        boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* component="Label_Event": Live bet — #E20000 на 30%, Top Event — #B40E0E */}
        {!forceTopBadge && status === 'live' ? (
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'Roboto Flex, sans-serif', fontSize: '10px', fontWeight: 500, lineHeight: 1.1, padding: '4px 12px', borderRadius: '60px', color: '#E20000', background: 'rgba(226,0,0,0.3)' }}>
            {t('card.liveBet')}
          </span>
        ) : (
          <span style={{ fontFamily: 'Roboto Flex, sans-serif', fontSize: '10px', fontWeight: 400, lineHeight: 1.1, padding: '4px 12px', borderRadius: '60px', background: '#B40E0E', color: '#FFFFFF' }}>{t('card.topEvent')}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'Roboto Flex, sans-serif', fontSize: '10px', fontWeight: 700, lineHeight: 1, textTransform: 'uppercase', color: '#FFFE45' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {timeLeft}
        </div>
      </div>

      <p style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '10px', fontWeight: 400, lineHeight: 1.1, textAlign: 'center', margin: 0 }}>{league}</p>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '64px' }}>
        <TeamCircle name={home.name} icon={home.icon} />
        <TeamCircle name={away.name} icon={away.icon} />
      </div>

      
      {outcomes.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          ...(isTwoWay && { width: '66.67%', alignSelf: 'center' }),
        }}>
          {outcomes.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected(o.key)}
              style={{
                flex: 1,
                height: '32px',
                borderRadius: '60px',
                background: selected === o.key ? 'rgba(255,255,255,0.1)' : '#131313',
                border: selected === o.key ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontSize: '10px', fontWeight: 400, lineHeight: 1.1 }}>{o.label}</span>
              <span style={{ color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: 1.1 }}>{o.value}</span>
            </button>
          ))}
        </div>
      )}

      
      <button
        onClick={handleMakePredict}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '12px',
          border: '1px solid transparent',
          background: 'linear-gradient(#E20000, #E20000) padding-box, ' +
            'linear-gradient(180deg, rgba(255,191,192,0.15) 0%, rgba(255,210,210,0) 100%) border-box',
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 600,
          fontSize: '14.3px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        {t('prediction.predict')}
      </button>
    </div>
  )
}
