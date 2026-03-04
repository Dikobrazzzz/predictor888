import imgGates from '/icons/0214656b.webp'
import imgStar from '/icons/bc4c4d84.webp'
import imgAviator from '/icons/087e19e8.webp'

export default function DailyRewards() {
  return (
    <div style={{ marginTop: '24px' }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '12px' }}>
        <img src="/icons/Icon-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
        <h2 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', margin: 0 }}>Promo</h2>
      </div>

      {/* Horizontal scroll */}
      <div style={{ display: 'flex', gap: '12px', paddingLeft: '20px', paddingRight: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">

        {/* Card 1 — Gates of Olympus */}
        <div style={{
          flexShrink: 0,
          width: '255px',
          height: '142px',
          borderRadius: '18px',
          border: '0.68px solid #BDBDBD0F',
          background: 'linear-gradient(to bottom right, #622380, #14071A)',
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
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Promo code</div>
              <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '12px', lineHeight: 1.45 }}>
                Get 100 free spins<br />in Gates of Olympus
              </div>
            </div>
            <button style={{
              width: '95px', height: '29px', background: '#FFFE45', borderRadius: '8px', border: 'none',
              color: '#0E0D0D', fontWeight: 700, fontSize: '12px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent', alignSelf: 'flex-start',
            }}>
              Claim Now
            </button>
          </div>

          <img src={imgStar} alt="" fetchpriority="high" style={{
            position: 'absolute', right: '90px', bottom: '20%',
            height: '100%', width: 'auto', objectFit: 'contain',
            pointerEvents: 'none',
            transform: 'rotate(90deg) scaleX(-1)', transformOrigin: 'center center',
          }} />
          <img src={imgGates} alt="Gates of Olympus" fetchpriority="high" style={{
            position: 'absolute', right: 0, top: '-20%',
            height: '225%', width: 'auto', objectFit: 'contain',
            objectPosition: 'right top', pointerEvents: 'none',
          }} />
        </div>

        {/* Card 2 — Aviator */}
        <div style={{
          flexShrink: 0,
          width: '255px',
          height: '142px',
          borderRadius: '18px',
          border: '0.68px solid #BDBDBD0F',
          background: 'linear-gradient(to bottom right, #802325, #1A0707)',
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
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Promo code</div>
              <div style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '12px', lineHeight: 1.45 }}>
                Get 100 free spins<br />in Aviator
              </div>
            </div>
            <button style={{
              width: '95px', height: '29px', background: '#FFFE45', borderRadius: '8px', border: 'none',
              color: '#0E0D0D', fontWeight: 700, fontSize: '12px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent', alignSelf: 'flex-start',
            }}>
              Claim Now
            </button>
          </div>

          <img src={imgAviator} alt="Aviator" fetchpriority="high" style={{
            position: 'absolute', right: 0, top: 0,
            height: '100%', width: 'auto', objectFit: 'cover',
            objectPosition: 'left center',
            borderRadius: '0 18px 18px 0',
            transform: 'scaleX(-1)',
            pointerEvents: 'none',
          }} />
        </div>

      </div>
    </div>
  )
}
