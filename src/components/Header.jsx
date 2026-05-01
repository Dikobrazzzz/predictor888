export default function Header({ user }) {
  const name = user?.login || '—'
  const xp = user?.points ?? 0

  return (
    <div>
      
      <div style={{ height: '1px', background: '#72777C33', width: '100%' }} />

      
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-lg font-bold overflow-hidden">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-xs leading-none mb-0.5" style={{ color: '#525252' }}>Welcome back,</div>
            <div className="text-white font-bold text-sm leading-none">{name}</div>
          </div>
        </div>

        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            style={{
              width: '96px',
              height: '32px',
              borderRadius: '89px',
              border: '0.7px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFFE45', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/icons/Champ.svg" alt="xp" style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ color: '#FFFE45', fontWeight: 500, fontSize: '14px', lineHeight: 1 }}>
              {xp} XP
            </span>
          </div>
          <img src="/icons/Flags-2.svg" alt="" style={{ height: '21px', width: 'auto', flexShrink: 0 }} />
        </div>
      </div>

      
      <div style={{ height: '1px', background: '#72777C33', width: '100%', marginBottom: '16px' }} />
    </div>
  )
}
