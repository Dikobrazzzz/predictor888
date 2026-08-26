import { useState, useEffect } from 'react'
import { useT } from '../i18n'
import { apiFetch } from '../utils/api'
import Popup from './Popup'
import imgGates from '/icons/0214656b.webp'
import imgFlash from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'
import imgAviatorLogo from '/icons/657411d2.webp'

// Блок Promo на Home (Figma: Home_Tournament_375 / Home_Prediction_375 → Promo).
// Карточки 255×142 в горизонтальной ленте, gap 16 — уже, чем на странице Promo (343).
// Заливка карточки идёт слоем с непрозрачностью 0.32, поэтому альфа вшита в стопы.
const CARD_BORDER = 'linear-gradient(180deg, rgba(255,191,192,0.15) 0%, rgba(255,210,210,0) 100%) border-box'

// Арт подбирается по полю game из API: макет рисует Gates и Aviator по-разному.
const ART = {
  gates: {
    descKey: 'promo.descGates',
    bg: 'linear-gradient(306deg, rgba(98,35,128,0.32) 0%, rgba(20,7,26,0.32) 100%)',
    glow: 'linear-gradient(236deg, rgba(32,8,79,0) 0%, #08204F 98%)',
  },
  aviator: {
    descKey: 'promo.descAviator',
    bg: 'linear-gradient(306deg, rgba(128,35,37,0.32) 0%, rgba(26,7,7,0.32) 100%)',
    glow: 'linear-gradient(236deg, rgba(79,8,9,0) 0%, #4F0809 98%)',
  },
}

const LAYERS = {
  gates: [
    { src: imgFlash, w: 88, h: 64, m: '-0.834, -0.552, -0.552, 0.834, 200.958, 27.794' },
    { src: imgGates, w: 118, h: 248, m: '1, 0, 0, 1, 148, -19' },
  ],
  aviator: [
    { src: imgAviatorLogo, w: 121, h: 48, m: '0.903, -0.43, 0.43, 0.903, 135.185, 98.667' },
    { src: imgAviator, w: 234, h: 159, m: '-0.978, 0.208, 0.208, 0.978, 256.905, -37' },
  ],
}

function PromoCard({ promo, onClaimed }) {
  const t = useT()
  const [popup, setPopup] = useState(null)
  const art = ART[promo.game] || ART.gates
  const layers = LAYERS[promo.game] || LAYERS.gates

  // Код приходит только в ответе на claim — до нажатия его в данных нет.
  const handleClaim = async () => {
    try {
      const res = await apiFetch('/api/promos/claim', {
        method: 'POST',
        body: JSON.stringify({ promo_id: promo.id }),
      })
      if (!res.ok) return
      const data = await res.json()
      navigator.clipboard?.writeText(data.code).catch(() => {})
      setPopup(data.code)
      onClaimed?.()
    } catch {}
  }

  return (
    <div style={{
      position: 'relative',
      flexShrink: 0,
      width: '255px',
      height: '142px',
      borderRadius: '20px',
      border: promo.game === 'gates' ? '0.5px solid rgba(189,189,189,0.06)' : '0.5px solid transparent',
      background: promo.game === 'gates' ? art.bg : `${art.bg} padding-box, ${CARD_BORDER}`,
      boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      boxSizing: 'border-box',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflow: 'hidden',
    }}>
      {/* BG: подложка 185×142 слева направо */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '185px',
        background: art.glow,
        pointerEvents: 'none',
      }} />

      {layers.map((a) => (
        <img
          key={a.src}
          src={a.src}
          alt=""
          decoding="async"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${a.w}px`,
            height: `${a.h}px`,
            transformOrigin: '0 0',
            transform: `matrix(${a.m})`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      ))}

      <span style={{
        position: 'relative',
        zIndex: 1,
        width: '122px',
        color: '#FFFFFF',
        fontFamily: 'Roboto Flex, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        lineHeight: 1.1,
      }}>
        {t('promo.code')}
      </span>

      <p style={{
        position: 'relative',
        zIndex: 1,
        margin: 0,
        width: '122px',
        color: '#FFFFFF',
        fontFamily: 'Roboto Flex, sans-serif',
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: 1.3,
        whiteSpace: 'pre-line',
      }}>
        {t(art.descKey)}
      </p>

      {/* component="Button_Promo" (Property 1=Yellow) */}
      <button
        onClick={handleClaim}
        style={{
          position: 'relative',
          zIndex: 1,
          alignSelf: 'flex-start',
          height: '29px',
          padding: '8px 20px',
          borderRadius: '8px',
          border: '0.5px solid transparent',
          background: 'linear-gradient(#FFFE45, #FFFE45) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          color: '#0E0D0D',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {t('promo.getNow')}
      </button>

      {popup && (
        <Popup
          title={t('promo.claimedTitle')}
          body={t('promo.claimedBody', { code: popup })}
          actionLabel={t('promo.claimedAction')}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}

export default function DailyRewards({ pill: pillOverride }) {
  const t = useT()
  const [promos, setPromos] = useState([])
  const [fresh, setFresh] = useState(0)

  const load = () => {
    apiFetch('/api/promos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setPromos(d.promos || []); setFresh(d.new || 0) } })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const pill = pillOverride ?? (fresh > 0 ? t('promo.new', { count: fresh }) : null)

  return (
    <div style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <img src="/icons/Icon-2.svg" alt="" width="20" height="20" style={{ display: 'block' }} />
        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '16px',
          textTransform: 'capitalize',
        }}>
          {t('promo.title')}
        </span>
        {/* component="Label_Event" — в макете есть только на Rank */}
        {pill && (
          <span style={{
            marginLeft: 'auto',
            flexShrink: 0,
            padding: '4px 12px',
            borderRadius: '60px',
            background: 'rgba(255,255,255,0.1)',
            color: '#FFFE45',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '10px',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}>
            {pill}
          </span>
        )}
      </div>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', gap: '16px', overflowX: 'auto', marginLeft: '-16px', marginRight: '-16px', padding: '0 16px' }}
      >
        {promos.map((promo) => (
          <PromoCard key={promo.id} promo={promo} onClaimed={load} />
        ))}
      </div>
    </div>
  )
}
