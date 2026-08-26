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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '40px', height: '40px', padding: 0,
          borderRadius: '8px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Language"
      >
        <img
          src={`/icons/flags/${current.code}.svg`}
          alt=""
          width="26"
          height="26"
          style={{ borderRadius: '50%', display: 'block' }}
        />
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
                  <img
                    src={`/icons/flags/${l.code}.svg`}
                    alt=""
                    width="22"
                    height="22"
                    style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
                  />
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
  // Значения-заглушки взяты из макета, пока профиль не пришёл из API.
  const name = user?.login || 'Alex Rank'
  const xp = user?.points ?? 1240

  return (
    <div>

      <div style={{ height: '1px', background: '#72777C33', width: '100%' }} />


      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px' }}>

        {/* Profile 168x51: аватар 51 с фото 40 внутри и полупрозрачным кругом поверх */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '51px', height: '51px', flexShrink: 0 }}>
            <img
              src={user?.avatar || '/icons/avatar-default.webp'}
              alt=""
              width="40"
              height="40"
              decoding="async"
              style={{ position: 'absolute', left: '5px', top: '5px', borderRadius: '60px', objectFit: 'cover' }}
            />
            <span style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: 'rgba(110,110,110,0.2)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Одна текстовая нода в макете: первая строка #555555, вторая #FFFFFF */}
          <span style={{
            fontFamily: '-apple-system, "SF Pro Text", "Roboto Flex", sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '18.9px',
            whiteSpace: 'pre-line',
          }}>
            <span style={{ color: '#555555' }}>{t('header.welcomeBack')}{'\n'}</span>
            <span style={{ color: '#FFFFFF' }}>{name}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
          {/* component="XP" */}
          <div
            style={{
              height: '36px',
              borderRadius: '60px',
              border: '0.5px solid transparent',
              background:
                'linear-gradient(rgba(255,255,255,0.01), rgba(255,255,255,0.01)) padding-box, ' +
                'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%) border-box',
              // В макете у тени снят «показывать за прозрачными областями», поэтому
              // внутрь пилюли она не попадает. CSS так не умеет: box-shadow рисуется
              // и под элементом, а при заливке в 1% это заметно затемняло фон.
              boxSizing: 'border-box',
              padding: '8px 16px 8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{
              width: '20px', height: '20px',
              borderRadius: '60px',
              background: '#FFFE45',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/icons/xp-rank.svg" alt="" width="14" height="14" style={{ display: 'block' }} />
            </span>
            <span style={{
              color: '#FFFE45',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
            }}>
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
