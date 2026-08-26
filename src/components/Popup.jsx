import { useEffect } from 'react'

// component="Pop-up" (Figma 318x237): r=28, pad 40, вертикальный стек gap 32,
// внутри текстовый блок gap 20 и красная кнопка 48px. Крестик 24x24 сверху справа.
// Подложка взята с экрана Quest_Popup_375: rgba(34,34,34,0.5) + блюр 16.
export default function Popup({ title, body, actionLabel, onAction, onClose, support }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(34,34,34,0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '318px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '40px',
          borderRadius: '28px',
          border: '0.7px solid transparent',
          background:
            'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, ' +
            'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '24px',
            height: '24px',
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <img src="/icons/f-cross.svg" alt="" width="16" height="16" style={{ display: 'block' }} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
          <span style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '22px',
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            {title}
          </span>
          <p style={{
            margin: 0,
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: 1,
            textAlign: 'center',
          }}>
            {body}
          </p>
        </div>

        {actionLabel && (
          <button
            onClick={onAction || onClose}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              border: '1px solid transparent',
              background: 'linear-gradient(#E20000, #E20000) padding-box, ' +
                'linear-gradient(180deg, rgba(255,191,192,0.15) 0%, rgba(255,210,210,0) 100%) border-box',
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 600,
              fontSize: '14.3px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {actionLabel}
          </button>
        )}

        {support && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <span style={{ color: '#6E6E6E', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', lineHeight: 1, textAlign: 'center' }}>
              {support.label}
            </span>
            <span style={{ color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif', fontSize: '12px', lineHeight: 1, textAlign: 'center' }}>
              {support.value}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
