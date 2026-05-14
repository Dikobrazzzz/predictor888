import { useState } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import imgGates from '/icons/0214656b.webp'
import imgStar from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'

const PROMOS = [
  {
    code: 'UZ150FS',
    title: 'Promokod',
    desc: '150 ta free spin\ndepozitsiz',
    bg: 'linear-gradient(to bottom right, #622380, #14071A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
    img1: { src: null, star: true },
    img2: { src: null, gates: true },
  },
  {
    code: 'UZ888SPORT',
    title: 'Promokod',
    desc: '1.8 mln UZS gacha\nsport bonusi',
    bg: 'linear-gradient(to bottom right, #802325, #1A0707) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
    img1: null,
    img2: { src: null, aviator: true },
  },
]

function PromoCard({ promo, large = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(promo.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{
      width: '100%',
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
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: large ? 16 : 15, marginBottom: '4px' }}>
            {promo.title}
          </div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,254,69,0.15)',
            border: '1px solid rgba(255,254,69,0.40)',
            borderRadius: '6px',
            padding: '2px 8px',
            color: '#FFFE45',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.5px',
            marginBottom: '4px',
          }}>
            {promo.code}
          </div>
          <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '12px', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
            {promo.desc}
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            width: copied ? '115px' : '103px',
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
          {copied ? 'Nusxalandi!' : 'Hozir olish'}
        </button>
      </div>

      {promo.img1?.star && (
        <img src={imgStar} alt="" fetchpriority="high" style={{
          position: 'absolute', right: '110px', bottom: '20%',
          height: '100%', width: 'auto', objectFit: 'contain',
          pointerEvents: 'none',
          transform: 'rotate(90deg) scaleX(-1)', transformOrigin: 'center center',
        }} />
      )}
      {promo.img2?.gates && (
        <img src={imgGates} alt="Gates of Olympus" fetchpriority="high" style={{
          position: 'absolute', right: 0, top: '-20%',
          height: '225%', width: 'auto', objectFit: 'contain',
          objectPosition: 'right top', pointerEvents: 'none',
        }} />
      )}
      {promo.img2?.aviator && (
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

export default function Promo({ navigate, user }) {
  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <img src="/icons/Icon-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Promo</span>
        </div>

        {PROMOS.map((promo) => (
          <PromoCard key={promo.code} promo={promo} large />
        ))}
      </div>

      <BottomNav active="promo" onNavigate={navigate} />
    </div>
  )
}
