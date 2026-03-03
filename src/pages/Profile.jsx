import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { mockUser } from '../mockData'

const CARD_GRADIENT = 'linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(to top right, #323232B2, #6F6F6FA1)'

const PROFILE_FIELDS = [
  { label: 'Username',     value: mockUser.name },
  { label: 'Email',        value: 'alex@example.com' },
  { label: 'Phone',        value: '+1 234 567 8900' },
  { label: 'Country',      value: 'United States' },
  { label: 'Member since', value: 'January 2024' },
]

export default function Profile({ navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header />

      {/* Main card */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px', marginTop: '8px' }}>
        <div
          style={{
            width: '342px',
            minHeight: '456px',
            background: CARD_GRADIENT,
            backdropFilter: 'blur(61px)',
            borderRadius: '500px',
            border: '0.7px solid rgba(255,255,255,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 20px 32px',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Title */}
          <span style={{
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '17px',
            letterSpacing: '0.01em',
            marginBottom: '4px',
          }}>
            Profile Information
          </span>

          {/* 5 info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
            {PROFILE_FIELDS.map((field) => (
              <div
                key={field.label}
                style={{
                  width: '302px',
                  height: '68px',
                  background: '#131313',
                  borderRadius: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '0 24px',
                  boxSizing: 'border-box',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '11px', fontWeight: 500, marginBottom: '3px' }}>
                  {field.label}
                </span>
                <span style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600 }}>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  )
}
