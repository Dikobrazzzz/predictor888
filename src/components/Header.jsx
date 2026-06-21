import { useState } from 'react'
import { useI18n } from '../i18n'

function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n()
  const [open, setOpen] = useState(false)
  const current = languages.find((l) => l.code === lang) || languages[0]

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          height: '32px', padding: '0 8px',
          borderRadius: '89px',
          border: '0.7px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Language"
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{current.flag}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3">
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1200 }}
          />
          <div
            style={{
              position: 'absolute', top: '38px', right: 0, zIndex: 1300,
              minWidth: '150px',
              background: '#1B1B1D',
              border: '0.7px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0px 12px 32px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}
          >
            {languages.map((l) => {
              const active = l.code === lang
              return (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? 'rgba(255,254,69,0.10)' : 'transparent',
                    color: active ? '#FFFE45' : '#FFFFFF',
                    fontSize: '14px', fontWeight: active ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function Header({ user }) {
  const { t } = useI18n()
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
            <div className="text-xs leading-none mb-0.5" style={{ color: '#525252' }}>{t('header.welcomeBack')}</div>
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
              {xp} {t('common.xp')}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>


      <div style={{ height: '1px', background: '#72777C33', width: '100%', marginBottom: '16px' }} />
    </div>
  )
}
