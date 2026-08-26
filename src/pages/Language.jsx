import ScreenBg from '../components/ScreenBg'
import OnboardHeader from '../components/OnboardHeader'
import { useI18n, useT } from '../i18n'

const CARD_BG =
  'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, ' +
  'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'

// component="Checkmark" (Default / Clicked). В макете внутри нет никакой фигуры —
// это просто круг 22x22, меняющий заливку и обводку.
function Checkmark({ checked }) {
  return (
    <span style={{
      width: '22px',
      height: '22px',
      flexShrink: 0,
      borderRadius: '60px',
      background: checked ? '#FFFE45' : '#1B1B1D',
      border: checked ? 'none' : '1px solid rgba(114,119,124,0.2)',
      boxSizing: 'border-box',
    }} />
  )
}

// Ro'yxat ilovaning til reestridan quriladi — Figma'dagi qat'iy ro'yxatdan emas.
export default function Language({ navigate, onContinue }) {
  const t = useT()
  const { lang, setLang, languages } = useI18n()

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#131313',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ScreenBg />
      <OnboardHeader />

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 26px 0',
      }}>
        <div style={{
          borderRadius: '28px',
          border: '0.7px solid transparent',
          background: CARD_BG,
          boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxSizing: 'border-box',
          padding: '24px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
            }}>
              {t('lang.title')}
            </span>
            <p style={{
              margin: 0,
              color: '#AEAEAE',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: 1.35,
            }}>
              {t('lang.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {languages.map((l) => {
              const active = l.code === lang
              return (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  style={{
                    height: '54px',
                    borderRadius: '20px',
                    background: '#131313',
                    border: active ? '0.7px solid #FFFE45' : '1px solid rgba(160,160,160,0.15)',
                    boxSizing: 'border-box',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <img
                    src={`/icons/flags/${l.code}.svg`}
                    alt=""
                    width="22"
                    height="22"
                    style={{ borderRadius: '50%', flexShrink: 0, display: 'block' }}
                  />
                  <span style={{
                    flex: 1,
                    textAlign: 'left',
                    color: '#FFFFFF',
                    fontFamily: 'Roboto Flex, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                  }}>
                    {l.label}
                  </span>
                  <Checkmark checked={active} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 26px 49px' }}>
        <button
          onClick={() => (onContinue ? onContinue() : navigate?.('telegramId'))}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            border: '1px solid transparent',
            background: 'linear-gradient(#FFFE45, #FFFE45) padding-box, ' +
              'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
            color: '#0E0D0D',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('lang.continue')}
        </button>
      </div>
    </div>
  )
}
