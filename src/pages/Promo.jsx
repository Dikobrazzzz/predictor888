import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { useT } from '../i18n'
import { apiFetch } from '../utils/api'
import Popup from '../components/Popup'
import imgGates from '/icons/0214656b.webp'
import imgFlash from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'
import imgAviatorLogo from '/icons/657411d2.webp'
import imgReward from '/icons/ab33ad55.webp'

// Ramka gradienti — dizayn tizimidagi barcha kartalar uchun bir xil
const BORDER_GRADIENT = 'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'

// Арт подбирается по game из API; матрицы сняты из макета (карточка 343px).
const ART = {
  gates: {
    descKey: 'promo.descGates',
    bg: 'linear-gradient(306deg, rgba(98,35,128,0.32) 0%, rgba(20,7,26,0.32) 100%)',
    glow: 'linear-gradient(236deg, rgba(32,8,79,0) 0%, #08204F 98%)',
    layers: [
      { src: imgFlash, w: 107, h: 77, m: '-0.834, -0.552, -0.552, 0.834, 254.853, 36.016' },
      { src: imgGates, w: 166, h: 349, m: '1, 0, 0, 1, 186, -32' },
    ],
  },
  aviator: {
    descKey: 'promo.descAviator',
    bg: 'linear-gradient(306deg, rgba(128,35,37,0.32) 0%, rgba(26,7,7,0.32) 100%)',
    glow: 'linear-gradient(236deg, rgba(79,8,9,0) 0%, #4F0809 98%)',
    layers: [
      { src: imgAviatorLogo, w: 141, h: 56, m: '0.903, -0.43, 0.43, 0.903, 176.78, 101.171' },
      { src: imgAviator, w: 272, h: 185, m: '-0.978, 0.208, 0.208, 0.978, 318.479, -56.765' },
    ],
  },
}

const QuestIcon = (
  <svg width="20" height="20" viewBox="0 0 14.01 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 12C13.17 12 13.338 11.956 13.487 11.873C13.636 11.79 13.761 11.671 13.85 11.526C13.94 11.381 13.991 11.215 13.998 11.045C14.006 10.875 13.97 10.705 13.894 10.553L12.118 7L13.894 3.447C13.97 3.295 14.006 3.125 13.998 2.955C13.991 2.785 13.94 2.619 13.85 2.474C13.761 2.329 13.636 2.21 13.487 2.127C13.338 2.044 13.17 2 13 2H2V1C2 0.735 1.895 0.48 1.707 0.293C1.52 0.105 1.265 0 1 0C0.735 0 0.48 0.105 0.293 0.293C0.105 0.48 0 0.735 0 1V19C0 19.265 0.105 19.52 0.293 19.707C0.48 19.895 0.735 20 1 20C1.265 20 1.52 19.895 1.707 19.707C1.895 19.52 2 19.265 2 19V12H13Z" fill="#FFFE45"/>
  </svg>
)

const LockIcon = (
  <svg width="12" height="12" viewBox="0 0 9 10.5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.125 3.75H7.875C8.173 3.75 8.46 3.869 8.67 4.08C8.881 4.29 9 4.577 9 4.875V9.375C9 9.673 8.881 9.96 8.67 10.17C8.46 10.381 8.173 10.5 7.875 10.5H1.125C0.827 10.5 0.54 10.381 0.33 10.17C0.119 9.96 0 9.673 0 9.375V4.875C0 4.577 0.119 4.29 0.33 4.08C0.54 3.869 0.827 3.75 1.125 3.75Z" fill="#FBF91D"/>
    <path d="M4.5 0C5.296 0 6.059 0.316 6.621 0.879C7.184 1.441 7.5 2.204 7.5 3V4.5H6.75V3C6.75 2.403 6.513 1.831 6.091 1.409C5.669 0.987 5.097 0.75 4.5 0.75C3.903 0.75 3.331 0.987 2.909 1.409C2.487 1.831 2.25 2.403 2.25 3V4.5H1.5V3C1.5 2.204 1.816 1.441 2.379 0.879C2.941 0.316 3.704 0 4.5 0Z" fill="#FBF91D"/>
  </svg>
)

function SectionTitle({ icon, title, pill, onPill }) {
  const Pill = onPill ? 'button' : 'span'
  return (
    <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {icon}
      <span style={{
        flex: 1,
        color: '#FFFFFF',
        fontFamily: 'Roboto Flex, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
      }}>
        {title}
      </span>
      <Pill
        onClick={onPill}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '60px',
          padding: '4px 12px',
          color: '#FFFE45',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '10px',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          cursor: onPill ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {pill}
      </Pill>
    </div>
  )
}

function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0
  const complete = done >= total
  return (
    <div style={{ height: '6px', borderRadius: '19px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '19px', background: complete ? '#8FFF37' : '#FFFE45', transition: 'width 0.3s' }} />
    </div>
  )
}

// "2 / 5" — sanoq rangli, maxraj oq. Bajarilganda sanoq yashil bo'ladi.
function Counter({ done, total, weight = 400 }) {
  const complete = done >= total
  return (
    <span style={{
      fontFamily: 'Roboto Flex, sans-serif',
      fontWeight: weight,
      fontSize: '12px',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: complete ? '#8FFF37' : '#FFFE45' }}>{done}</span>
      <span style={{ color: '#FFFFFF' }}>{' / '}{total}</span>
    </span>
  )
}

function WeeklyRewardCard({ done, total, onOpen }) {
  const t = useT()
  const completed = done >= total

  return (
    <div style={{
      borderRadius: '20px',
      border: '0.7px solid transparent',
      background:
        'radial-gradient(47.9% 34.3% at 50% 67.2%, rgba(255,196,0,0.112) 0%, rgba(0,0,0,0) 100%) padding-box, ' +
        'linear-gradient(#1B1B1D, #1B1B1D) padding-box, ' + BORDER_GRADIENT,
      boxSizing: 'border-box',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
          <div style={{
            width: '65px',
            height: '65px',
            flexShrink: 0,
            borderRadius: '16px',
            border: '1px solid rgba(114,119,124,0.2)',
            background: 'linear-gradient(rgba(255,254,69,0.06), rgba(255,254,69,0.06)), #0E0D0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}>
            <img src={imgReward} alt="" width="53" height="53" decoding="async" style={{ display: 'block' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{
                color: '#FFFFFF',
                fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
              }}>
                {t('quests.rewardTitle')}
              </span>
              {completed ? (
                <span style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  borderRadius: '36px',
                  border: '0.5px solid rgba(255,254,69,0.4)',
                  background: '#FFFE45',
                  color: '#0E0D0D',
                  fontFamily: 'Roboto Flex, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {t('quests.unlocked')}
                </span>
              ) : LockIcon}
            </div>

            <p style={{
              margin: 0,
              color: '#AEAEAE',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: 1.35,
            }}>
              {completed ? t('quests.rewardDescDone') : t('quests.rewardDesc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Counter done={done} total={total} weight={700} />
              <ProgressBar done={done} total={total} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              color: completed ? '#FFFE45' : 'rgba(255,255,255,0.2)',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
            }}>
              {completed ? t('quests.allDone') : t('quests.completeAll', { total })}
            </span>
            <Counter done={done} total={total} />
          </div>
          <ProgressBar done={done} total={total} />
        </div>
      </div>

      {/* Barcha kvestlar bajarilgach tugma "Claim Reward"ga almashadi. */}
      <button onClick={onOpen} style={{
        width: '100%',
        height: '48px',
        borderRadius: '12px',
        border: '1px solid transparent',
        background: `linear-gradient(${completed ? '#E20000, #E20000' : '#FFFE45, #FFFE45'}) padding-box, ` +
          'linear-gradient(180deg, rgba(255,191,192,0.15) 0%, rgba(255,210,210,0) 100%) border-box',
        color: completed ? '#FFFFFF' : '#0E0D0D',
        fontFamily: 'Roboto Flex, sans-serif',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {completed ? t('quests.claim') : t('quests.cta')}
      </button>
    </div>
  )
}

function PromoCard({ promo, onClaimed }) {
  const t = useT()
  const [popup, setPopup] = useState(null)
  const art = ART[promo.game] || ART.gates

  // Промокод копируется в буфер, подтверждение показываем компонентом Pop-up.
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
      height: '142px',
      borderRadius: '20px',
      border: '0.5px solid transparent',
      background: `${art.bg} padding-box, ${BORDER_GRADIENT}`,
      boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
      boxSizing: 'border-box',
      padding: '20px 24px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '53.9%',
        background: art.glow,
        pointerEvents: 'none',
      }} />

      {art.layers.map((a) => (
        <img
          key={a.src}
          src={a.src}
          alt=""
          fetchpriority="high"
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

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '122px' }}>
        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '16px',
        }}>
          {t('promo.code')}
        </span>

        <p style={{
          margin: 0,
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: 1.35,
          whiteSpace: 'pre-line',
        }}>
          {t(art.descKey)}
        </p>

        <button
          onClick={handleClaim}
          style={{
            height: '29px',
            alignSelf: 'flex-start',
            padding: '8px 20px',
            borderRadius: '8px',
            border: '0.5px solid transparent',
            background: 'linear-gradient(#FFFE45, #FFFE45) padding-box, ' + BORDER_GRADIENT,
            color: '#0E0D0D',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '12px',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.2s',
          }}
        >
          {t('promo.getNow')}
        </button>
      </div>

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

export default function Promo({ navigate, user }) {
  const t = useT()
  const [quests, setQuests] = useState(null)
  const [promos, setPromos] = useState([])
  const [fresh, setFresh] = useState(0)

  const loadPromos = () => {
    apiFetch('/api/promos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setPromos(d.promos || []); setFresh(d.new || 0) } })
      .catch(() => {})
  }

  useEffect(() => {
    loadPromos()
    apiFetch('/api/quests')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setQuests(d) })
      .catch(() => {})
  }, [])

  const done = quests?.done ?? 0
  const total = quests?.total ?? 5

  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

      <section style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionTitle
          icon={QuestIcon}
          title={t('quests.title')}
          pill={t('quests.seeAll')}
          onPill={() => navigate?.('quests')}
        />
        <WeeklyRewardCard done={done} total={total} onOpen={() => navigate?.('quests')} />
      </section>

      <section style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionTitle
          icon={<img src="/icons/Icon-2.svg" alt="" width="20" height="20" />}
          title={t('promo.title')}
          pill={t('promo.new', { count: fresh })}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {promos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} onClaimed={loadPromos} />
          ))}
        </div>
      </section>

      <BottomNav active="promo" onNavigate={navigate} />
    </div>
  )
}
