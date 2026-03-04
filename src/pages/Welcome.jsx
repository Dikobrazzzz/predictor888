import BottomNav from '../components/BottomNav'

export default function Welcome({ onStart }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#131313',
      backgroundImage: 'url(/icons/BG.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '110px',
    }}>
      {/* Logo instead of Header */}
      <div style={{
        width: '100%',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        <img src="/icons/Logo-2.svg" alt="Logo" style={{ height: '32px' }} />
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
      }}>
        <h1 style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '28px',
          textAlign: 'center',
          textTransform: 'capitalize',
          margin: 0,
        }}>
          Welcome!
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
          Bet on events and get bonuses
        </p>

        <img
          src="/icons/img.svg"
          alt=""
          style={{ width: '100%', maxWidth: '300px' }}
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
          Engaging users in guessing outcomes. Promo codes. Displaying user status.
        </p>

        <button
          onClick={onStart}
          style={{
            width: '334px',
            height: '56px',
            borderRadius: '400px',
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
          <span style={{ position: 'relative', zIndex: 1 }}>Start</span>
        </button>
      </div>

      <BottomNav active="" onNavigate={() => {}} />
    </div>
  )
}
