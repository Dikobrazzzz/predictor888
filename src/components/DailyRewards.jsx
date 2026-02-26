import { mockRewards } from '../mockData'

export default function DailyRewards() {
  return (
    <div style={{ marginTop: '24px' }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '12px' }}>
        <span style={{ color: '#FFFE45', fontSize: '18px', lineHeight: 1 }}>★</span>
        <h2 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', margin: 0 }}>Daily Rewards</h2>
      </div>

      {/* Horizontal scroll */}
      <div style={{ display: 'flex', gap: '12px', paddingLeft: '20px', paddingRight: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
        {mockRewards.map((reward) => (
          <div
            key={reward.id}
            style={{
              flexShrink: 0,
              width: '255px',
              height: '148px',
              borderRadius: '18px',
              border: '0.68px solid #BDBDBD0F',
              background: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), linear-gradient(to top right, ${reward.gradientDark} 0%, ${reward.gradientLight} 100%)`,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden', backdropFilter: 'blur(61.41px)', WebkitBackdropFilter: 'blur(61.41px)',
            }}
          >
            <img src="/icons/ticket-star.svg" alt="" style={{ position: 'absolute', right: '10px', bottom: '30px', width: '90px', height: '90px', opacity: 0.18, transform: 'rotate(-20deg)', pointerEvents: 'none' }} />
            <img src="/icons/ticket-star.svg" alt="" style={{ position: 'absolute', right: '6px', bottom: '-10px', width: '68px', height: '68px', opacity: 0.18, transform: 'rotate(10deg)', pointerEvents: 'none' }} />

            <div>
              <h3 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', margin: '0 0 6px 0' }}>{reward.title}</h3>
              <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: '12px', lineHeight: '1.4', margin: 0, opacity: 0.85 }}>{reward.description}</p>
            </div>

            <button
              style={{ width: '102px', height: '33px', borderRadius: '10px', background: 'rgba(255,255,255,0.11)', border: '0.5px solid rgba(255,255,255,0.20)', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Claim Now
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
