import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import { setSession, apiFetch } from '../utils/api'

function detectRegion() {
  try {
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
    const locale = tgLang || navigator.language || (navigator.languages && navigator.languages[0]) || ''
    const parts = locale.split('-')
    const countryCode = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
    if (countryCode.length === 2) {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode
    }
    const lang2country = { ru: 'Russia', uz: 'Uzbekistan', kz: 'Kazakhstan', uk: 'Ukraine', az: 'Azerbaijan', tr: 'Turkey', en: 'United States' }
    return lang2country[parts[0].toLowerCase()] || parts[0].toUpperCase()
  } catch {
    return ''
  }
}
import vectorSvg from '/icons/Vector-3.svg'
import redLightSvg from '/icons/red light.svg'
import closeIcon from '/icons/Icon-3.svg'

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function Login({ onLogin }) {
  const [mail, setMail] = useState('')
  const [touched, setTouched] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const invalid = touched && !isValidEmail(mail)

  const handleLogin = async () => {
    setTouched(true)
    if (!isValidEmail(mail)) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        if (!data.user.region) {
          const region = detectRegion()
          if (region) {
            try {
              const upd = await apiFetch('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify({ region }),
              })
              const updUser = upd.ok ? await upd.json() : null
              const finalUser = updUser?.id ? updUser : data.user
              setSession(finalUser, data.token)
              onLogin(finalUser)
            } catch {
              setSession(data.user, data.token)
              onLogin(data.user)
            }
          } else {
            setSession(data.user, data.token)
            onLogin(data.user)
          }
        } else {
          setSession(data.user, data.token)
          onLogin(data.user)
        }
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#131313',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '110px',
    }}>
      <img
        src={vectorSvg}
        alt=""
        fetchpriority="high"
        decoding="async"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
          mixBlendMode: 'overlay',
        }}
      />
      <img
        src={redLightSvg}
        alt=""
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      
      <div style={{
        width: '100%',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        position: 'relative', zIndex: 1,
      }}>
        <img src="/icons/Logo-2.svg" alt="Logo" style={{ width: '101px' }} />
      </div>

      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '322px',
          borderRadius: '27.35px',
          border: '0.7px solid transparent',
          background: 'linear-gradient(60.59deg, rgba(27,27,29,0.7) 3.68%, rgba(79,79,79,0.3) 109.56%) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxShadow: '0px 20px 60px 0px #0000001A',
          padding: '28px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
        }}>

          {notFound ? (
            <>
              <button
                onClick={() => { setNotFound(false); setMail(''); setTouched(false) }}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <img src={closeIcon} alt="close" style={{ width: '24px', height: '24px' }} />
              </button>

              <span style={{
                color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 700, fontSize: '18px', textAlign: 'center',
                marginTop: '8px',
              }}>
                Bu email topilmadi
              </span>

              <span style={{
                color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400, fontSize: '13px', textAlign: 'center',
                lineHeight: 1.5,
              }}>
                Agar yaqinda ro'yxatdan o'tgan bo'lsangiz, keyinroq qayta urinib ko'ring.
              </span>

              <span style={{
                color: '#6E6E6E', fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400, fontSize: '13px', textAlign: 'center',
              }}>
                Shaxsiy yordam kerakmi?
              </span>

              <span style={{
                color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400, fontSize: '13px', textAlign: 'center',
              }}>
                support@888STARZ
              </span>
            </>
          ) : (
            <>
              <span style={{
                color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700, fontSize: '20px', alignSelf: 'flex-start',
            }}>
              Kirish
            </span>

              <div style={{ width: '274px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={mail}
                  onChange={e => { setMail(e.target.value); setTouched(false) }}
                  onBlur={() => setTouched(true)}
                  style={{
                    width: '274px',
                    height: '62px',
                    minWidth: '100px',
                    borderRadius: '18px',
                    border: invalid
                      ? '1px solid #FF0000'
                      : '1px solid transparent',
                    background: invalid
                      ? 'linear-gradient(#131313, #131313) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'
                      : 'linear-gradient(#131313, #131313) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                    color: '#FFFFFF',
                    fontFamily: 'Roboto Flex, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    padding: '0 20px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                {invalid && (
                  <span style={{
                    color: '#ED0000', fontFamily: 'Roboto Flex, sans-serif',
                    fontWeight: 400, fontSize: '12px', paddingLeft: '4px',
                  }}>
                    Email noto'g'ri! Iltimos, qo'llab-quvvatlash xizmatiga murojaat qiling.
                  </span>
                )}
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: '274px',
                  height: '56px',
                  borderRadius: '18px',
                  border: '1px solid transparent',
                  background: 'linear-gradient(#FFFE45, #FFFE45) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
                  color: '#0E0D0D',
                  fontFamily: 'Roboto Flex, sans-serif',
                  fontWeight: 700,
                  fontSize: '17px',
                  cursor: 'pointer',
                  boxShadow: '0px 20px 60px 0px #0000001A',
                  backdropFilter: 'blur(60px)',
                  WebkitBackdropFilter: 'blur(60px)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Kirish
              </button>
            </>
          )}
        </div>

        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400, fontSize: '14px',
          }}>
            Muammo bormi?
          </span>
          <button style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#FFFE45', fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400, fontSize: '14px',
            WebkitTapHighlightColor: 'transparent',
          }}>
            Qo'llab-quvvatlash
          </button>
        </div>
      </div>

      <BottomNav active="" onNavigate={() => {}} />
    </div>
  )
}
