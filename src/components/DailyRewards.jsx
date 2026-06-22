import { useState } from 'react'
import { useT } from '../i18n'
import imgGates from '/icons/0214656b.webp'
import imgStar from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'

const PROMOS = [
  {
    code: 'UZ150FS',
    descKey: 'promo.desc150',
    bg: 'linear-gradient(to bottom right, #622380, #14071A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
    star: true,
    gates: true,
  },
]

function PromoCard({ promo }) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(promo.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{
      flexShrink: 0,
      width: '255px',
      height: '142px',
      borderRadius: '18px',
      border: '0.5px solid transparent',
      background: promo.bg,
      boxSizing: 'border-box',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, zIndex: 1 }}>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{t('promo.code')}</div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,254,69,0.15)',
            borderRadius: '6px',
            padding: '2px 7px',
            color: '#FFFE45',
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.5px',
            marginBottom: '3px',
          }}>
            {promo.code}
          </div>
          <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '12px', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
            {t(promo.descKey)}
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            width: copied ? '105px' : '95px',
            height: '29px',
            background: copied ? '#55B685' : '#FFFE45',
            borderRadius: '8px',
            border: 'none',
            color: '#0E0D0D',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            alignSelf: 'flex-start',
            transition: 'background 0.2s, width 0.15s',
          }}
        >
          {copied ? t('promo.copied') : t('promo.getNow')}
        </button>
      </div>

      {promo.star && (
        <img src={imgStar} alt="" fetchpriority="high" style={{
          position: 'absolute', right: '90px', bottom: '20%',
          height: '100%', width: 'auto', objectFit: 'contain',
          pointerEvents: 'none',
          transform: 'rotate(90deg) scaleX(-1)', transformOrigin: 'center center',
        }} />
      )}
      {promo.gates && (
        <img src={imgGates} alt="Gates of Olympus" fetchpriority="high" style={{
          position: 'absolute', right: 0, top: '-20%',
          height: '225%', width: 'auto', objectFit: 'contain',
          objectPosition: 'right top', pointerEvents: 'none',
        }} />
      )}
      {promo.aviator && (
        <img src={imgAviator} alt="Aviator" fetchpriority="high" style={{
          position: 'absolute', right: 0, top: 0,
          height: '100%', width: 'auto', objectFit: 'cover',
          objectPosition: 'left center',
          borderRadius: '0 18px 18px 0',
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

export default function DailyRewards() {
  const t = useT()
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '12px' }}>
        <img src="/icons/Icon-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
        <h2 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', margin: 0 }}>{t('promo.title')}</h2>
      </div>

      <div style={{ display: 'flex', gap: '12px', paddingLeft: '20px', paddingRight: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
        {PROMOS.map((promo) => (
          <PromoCard key={promo.code} promo={promo} />
        ))}
      </div>
    </div>
  )
}
