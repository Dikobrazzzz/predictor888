import BottomNav from '../components/BottomNav'
import { useT } from '../i18n'
import firstSvg from '/icons/first.svg'
import secondSvg from '/icons/second.svg'
import head2Svg from '/icons/3d_headphone_2023_36 [Converted] 2.svg'
import head3Svg from '/icons/3d_headphone_2023_36 [Converted] 3.svg'
import tg2Svg from '/icons/Telegram-2.svg'

const BTN_STYLE = {
  width: '334px',
  height: '56px',
  borderRadius: '18px',
  background: '#FFFE45',
  color: '#0E0D0D',
  fontFamily: 'Roboto Flex, sans-serif',
  fontWeight: 700,
  fontSize: '17px',
  cursor: 'pointer',
  border: '1px solid transparent',
  backgroundClip: 'padding-box',
  backgroundImage: 'linear-gradient(#FFFE45, #FFFE45)',
  boxShadow: '0px 20px 60px 0px #0000001A',
  backdropFilter: 'blur(60px)',
  WebkitBackdropFilter: 'blur(60px)',
  WebkitTapHighlightColor: 'transparent',
}

export default function Telegram({ onSubscribe, onSkip }) {
  const t = useT()
  return (
    <div style={{
      minHeight: '100vh',
      background: '#131313',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '110px',
    }}>
      
      <img src={firstSvg} alt="" fetchpriority="high" decoding="async" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', pointerEvents: 'none', userSelect: 'none',
        mixBlendMode: 'overlay',
      }} />
      <img src={secondSvg} alt="" decoding="async" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', pointerEvents: 'none', userSelect: 'none',
      }} />
      
      <div style={{
        width: '100%',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        position: 'relative', zIndex: 1,
      }}>
        <img src="/icons/Logo-2.svg" alt="Logo" style={{ width: '101px' }} />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 30px',
        gap: '20px',
        maxWidth: '375px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ position: 'relative', width: '120%', marginLeft: '-10%' }}>
          <img src={head2Svg} alt="" fetchpriority="high" style={{
            position: 'absolute',
            bottom: '15%',
            left: '2%',
            width: '57%',
            zIndex: 0,
          }} />
          <img src={head3Svg} alt="" fetchpriority="high" style={{
            position: 'absolute',
            bottom: '-13%',
            right: '-8%',
            width: '79%',
            zIndex: 0,
          }} />
          <img src={tg2Svg} alt="" fetchpriority="high"
            style={{ width: '100%', display: 'block', position: 'relative', zIndex: 1 }} />
        </div>

        <p style={{
          color: '#AEAEAE',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.5,
        }}>
          {t('welcome.desc')}
        </p>

        <button onClick={onSubscribe} style={BTN_STYLE}>
          {t('telegram.subscribe')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
          }}>
            {t('telegram.already')}
          </span>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#FFFE45',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t('telegram.skip')}
          </button>
        </div>
      </div>

      <BottomNav active="" onNavigate={() => {}} />
    </div>
  )
}
