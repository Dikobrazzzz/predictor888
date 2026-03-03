import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { mockUser } from '../mockData'

const CARD_GRADIENT = 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)'

export default function Profile({ navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header />

      <div style={{ padding: '0 20px' }}>
        {/* Main card — same radius as Profile Statistick (18px) */}
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

          {/* Title row with icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src="/icons/Icon_Tapbar.svg" alt="" style={{ width: '20px', height: '20px' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Profile Information</span>
          </div>

          {/* Top row: Your Position + Win Rate — same as Rank.jsx */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            {/* Your Position */}
            <div style={{
              flex: 1,
              height: '56px',
              borderRadius: '10px',
              background: '#1E1E24',
              border: '1.27px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 10px',
              gap: '8px',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(131,137,44,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img src="/icons/Iocn_Tapbar-2.svg" alt="" style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Your Position</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>#37</div>
              </div>
            </div>

            {/* Win rate */}
            <div style={{
              flex: 1,
              height: '56px',
              borderRadius: '10px',
              background: '#1E1E24',
              border: '1.27px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 10px',
              gap: '8px',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1C3B2C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img src="/icons/Iocn_Tapbar-3.svg" alt="" style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '9px', fontWeight: 500, marginBottom: '2px' }}>Win rate</div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, lineHeight: 1 }}>68%</div>
              </div>
            </div>
          </div>

          {/* Info rows — same border-radius as Win rate boxes (10px) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Email */}
            <div style={{
              height: '68px',
              background: '#131313',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}>
              <span style={{ color: '#686868', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>Email</span>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 400 }}>alex.rank@gmail.com</span>
            </div>

            {/* Region */}
            <div style={{
              height: '68px',
              background: '#131313',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}>
              <span style={{ color: '#686868', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>Region</span>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 400 }}>Uzbekistan</span>
            </div>

            {/* Subscription */}
            <div style={{
              height: '68px',
              background: '#131313',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}>
              <span style={{ color: '#686868', fontSize: '11px', fontWeight: 400, marginBottom: '4px' }}>Subscription</span>
              <span style={{ color: '#FF4D00', fontSize: '14px', fontWeight: 400 }}>Inactive</span>
            </div>

            {/* Delete Bot */}
            <div style={{
              height: '68px',
              background: '#131313',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              boxSizing: 'border-box',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ color: '#686868', fontSize: '14px', fontWeight: 400 }}>Delete Bot</span>
            </div>

          </div>
        </div>
      </div>

      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  )
}
