import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const CARD_GRADIENT = 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)'

function InfoRow({ icon, label, value, valueColor = '#FFFFFF', rightSlot }) {
  return (
    <div style={{
      height: '68px',
      background: '#131313',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '12px',
      boxSizing: 'border-box',
    }}>
      {/* Left icon square */}
      <div style={{
        width: '44px',
        height: '44px',
        background: '#1B1B1D',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={icon} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ color: '#686868', fontSize: '11px', fontWeight: 400, marginBottom: '3px' }}>{label}</span>
        <span style={{ color: valueColor, fontSize: '14px', fontWeight: 400 }}>{value}</span>
      </div>

      {/* Optional right button */}
      {rightSlot}
    </div>
  )
}

export default function Profile({ navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header />

      <div style={{ padding: '0 20px' }}>
        <div style={{
          width: '100%',
          borderRadius: '18px',
          border: '0.68px solid #BDBDBD0F',
          background: CARD_GRADIENT,
          backdropFilter: 'blur(61.41px)',
          WebkitBackdropFilter: 'blur(61.41px)',
          padding: '14px 16px',
          boxSizing: 'border-box',
        }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src="/icons/Icon_Tapbar.svg" alt="" style={{ width: '20px', height: '20px' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Profile Information</span>
          </div>

          {/* Your Position + Win rate */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              flex: 1, height: '56px', borderRadius: '10px',
              background: '#1E1E24', border: '1.27px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 10px', gap: '8px', boxSizing: 'border-box',
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(131,137,44,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/icons/Iocn_Tapbar-2.svg" alt="" style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Your Position</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>#37</div>
              </div>
            </div>

            <div style={{
              flex: 1, height: '56px', borderRadius: '10px',
              background: '#1E1E24', border: '1.27px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 10px', gap: '8px', boxSizing: 'border-box',
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1C3B2C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/icons/Iocn_Tapbar-3.svg" alt="" style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Win rate</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>68%</div>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <InfoRow
              icon="/icons/Vector.svg"
              label="Email"
              value="alex.rank@gmail.com"
            />

            <InfoRow
              icon="/icons/basil_location-solid.svg"
              label="Region"
              value="Uzbekistan"
            />

            <InfoRow
              icon="/icons/Telegram.svg"
              label="Subscription"
              value="Inactive"
              valueColor="#FF4D00"
              rightSlot={
                <button style={{
                  width: '98px',
                  height: '29px',
                  background: '#FFFE45',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#0E0D0D',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  Subscribe
                </button>
              }
            />

            <InfoRow
              icon="/icons/cuida_logout-outline.svg"
              label="Delete Bot"
              value=""
              rightSlot={
                <button style={{
                  width: '77px',
                  height: '29px',
                  background: '#555555',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#0E0D0D',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  Delete
                </button>
              }
            />

          </div>
        </div>
      </div>

      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  )
}
