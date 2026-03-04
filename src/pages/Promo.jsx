import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import imgGates from '/icons/0214656b.webp'
import imgStar from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'

export default function Promo({ navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <img src="/icons/Icon-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Promo</span>
        </div>

        {/* Promo card 1 — Gates of Olympus */}
        <div style={{
          width: '100%',
          height: '142px',
          borderRadius: '18px',
          border: '0.5px solid transparent',
          background: 'linear-gradient(to bottom right, #622380, #14071A) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          boxSizing: 'border-box',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Text + button */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, zIndex: 1 }}>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
                Promo code
              </div>
              <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '13px', lineHeight: 1.45 }}>
                Get 100 free spins<br />in Gates of Olympus
              </div>
            </div>
            <button style={{
              width: '103px', height: '29px',
              background: '#FFFE45', borderRadius: '8px', border: 'none',
              color: '#0E0D0D', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              alignSelf: 'flex-start',
            }}>
              Claim Now
            </button>
          </div>

          {/* Star image — rotated 90° clockwise, mirrored horizontally */}
          <img
            src={imgStar}
            alt=""
            fetchpriority="high"
            style={{
              position: 'absolute',
              right: '110px',
              bottom: '20%',
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              pointerEvents: 'none',
              transform: 'rotate(90deg) scaleX(-1)',
              transformOrigin: 'center center',
            }}
          />

          {/* Gates of Olympus image */}
          <img
            src={imgGates}
            alt="Gates of Olympus"
            fetchpriority="high"
            style={{
              position: 'absolute',
              right: 0,
              top: '-20%',
              height: '225%',
              width: 'auto',
              objectFit: 'contain',
              objectPosition: 'right top',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Promo card 2 — Aviator */}
        <div style={{
          width: '100%',
          height: '142px',
          borderRadius: '18px',
          border: '0.5px solid transparent',
          background: 'linear-gradient(to bottom right, #802325, #1A0707) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          boxSizing: 'border-box',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Text + button */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, zIndex: 1 }}>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
                Promo code
              </div>
              <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '13px', lineHeight: 1.45 }}>
                Get 100 free spins<br />in Aviator
              </div>
            </div>
            <button style={{
              width: '103px', height: '29px',
              background: '#FFFE45', borderRadius: '8px', border: 'none',
              color: '#0E0D0D', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              alignSelf: 'flex-start',
            }}>
              Claim Now
            </button>
          </div>

          {/* Aviator image — mirrored horizontally */}
          <img
            src={imgAviator}
            alt="Aviator"
            fetchpriority="high"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: 'auto',
              objectFit: 'cover',
              objectPosition: 'left center',
              borderRadius: '0 18px 18px 0',
              transform: 'scaleX(-1)',
            }}
          />
        </div>
      </div>

      <BottomNav active="promo" onNavigate={navigate} />
    </div>
  )
}
