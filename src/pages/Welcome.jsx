import { useT } from '../i18n'
import vectorSvg from '/icons/Vector-3.svg'
import redLightSvg from '/icons/red light.svg'
import imgInner from '../assets/img-inner.webp'

export default function Welcome({ onStart }) {
  const t = useT()
  return (
    <div style={{
      minHeight: '100vh',
      background: '#131313',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '110px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      
      <img
        src={vectorSvg}
        alt=""
        fetchpriority="high"
        decoding="async"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
          mixBlendMode: 'overlay',
        }}
      />
      
      <img
        src={redLightSvg}
        alt=""
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      
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
        position: 'relative', zIndex: 1,
        maxWidth: '375px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <h1 style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '42px',
            textAlign: 'center',
            textTransform: 'capitalize',
            margin: 0,
          }}>
            {t('welcome.title')}
          </h1>

          <p style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.4,
          }}>
            {t('welcome.subtitle')}
          </p>
        </div>

        <img
          src={imgInner}
          alt=""
          fetchpriority="high"
          decoding="async"
          style={{
            width: 'calc(200% + 60px)',
            marginLeft: '-30px',
            transform: 'rotate(12.71deg)',
            filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.5))',
          }}
        />

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

        <button
          onClick={onStart}
          style={{
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
            position: 'relative',
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>{t('welcome.start')}</span>
        </button>
      </div>
    </div>
  )
}
