import { useState } from 'react'
import ScreenBg from '../components/ScreenBg'
import OnboardHeader from '../components/OnboardHeader'
import { useT } from '../i18n'
import { apiFetch } from '../utils/api'
import { telegramUserId, initData } from '../utils/telegram'

const CARD_BG =
  'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, ' +
  'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'

// В макете значение показано как «# 8 240 517»: решётка остаётся слева,
// цифры разбиты по три. В состоянии храним только цифры.
const digitsOnly = (v) => v.replace(/\D/g, '')
const groupDigits = (v) => v.replace(/(\d{3})(?=\d)/g, '$1 ')

function ContinueButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: '56px',
        borderRadius: '16px',
        border: '1px solid transparent',
        background: disabled
          ? 'linear-gradient(#2D2D2F, #2D2D2F) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'
          : 'linear-gradient(#FFFE45, #FFFE45) padding-box, linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box',
        color: disabled ? '#555555' : '#0E0D0D',
        fontFamily: 'Roboto Flex, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

// Telegram ID_Mistake_375, вариант 3: сервер недоступен — поля нет, кнопка «Try again».
function NetworkError({ onRetry, onBack }) {
  const t = useT()
  return (
    <div style={{
      position: 'relative', minHeight: '100vh', background: '#131313',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <ScreenBg />
      <OnboardHeader />

      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', alignItems: 'center', padding: '0 26px',
      }}>
        <div style={{
          width: '100%',
          borderRadius: '28px',
          border: '0.7px solid transparent',
          background: CARD_BG,
          boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxSizing: 'border-box',
          padding: '24px 24px 32px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ color: '#FFFFFF', fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '18px' }}>
              {t('tgid.netTitle')}
            </span>
            <p style={{
              margin: 0, color: '#AEAEAE', fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400, fontSize: '14px', lineHeight: 1.35, textAlign: 'center',
            }}>
              {t('tgid.netBody')}
            </p>
          </div>

          <ContinueButton onClick={onRetry}>{t('tgid.tryAgain')}</ContinueButton>

          <button onClick={onBack} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#AEAEAE', fontFamily: 'Roboto Flex, sans-serif', fontWeight: 700, fontSize: '14px',
            WebkitTapHighlightColor: 'transparent',
          }}>
            {t('tgid.backToId')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Success({ playerId, onContinue }) {
  const t = useT()
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#131313',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ScreenBg decor={false} />
      <OnboardHeader />

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '0 26px',
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(255,254,69,0.17)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img src="/icons/check-big.svg" alt="" width="56" height="56" style={{ display: 'block' }} />
        </div>

        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          lineHeight: 1.15,
          textAlign: 'center',
        }}>
          {t('tgid.successTitle')}
        </span>

        <span style={{
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
        }}>
          {t('tgid.playerId')}{'  '}
          <span style={{ color: '#FFFFFF' }}>{playerId}</span>
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '0 26px 49px' }}>
        <ContinueButton onClick={onContinue}>{t('tgid.continue')}</ContinueButton>
      </div>
    </div>
  )
}

export default function TelegramId({ navigate, onLinked }) {
  const t = useT()
  const [value, setValue] = useState('')
  const [state, setState] = useState('idle')   // idle | loading | error | success

  const loading = state === 'loading'
  const error = state === 'error' || state === 'errorLinked'
  const errorKey = state === 'errorLinked' ? 'tgid.errorLinked' : 'tgid.error'
  const canSubmit = value.length > 0 && !loading

  const submit = async () => {
    if (!canSubmit) return
    setState('loading')
    try {
      const res = await apiFetch('/api/telegram/link', {
        method: 'POST',
        body: JSON.stringify({
          player_id: value,
          telegram_user_id: telegramUserId() || '',
          init_data: initData(),
        }),
      })
      if (res.ok) {
        setState('success')
      } else if (res.status === 404) {
        setState('error')
      } else if (res.status === 409) {
        setState('errorLinked')
      } else {
        setState('netError')
      }
    } catch {
      setState('netError')
    }
  }

  if (state === 'netError') {
    return <NetworkError onRetry={submit} onBack={() => setState('idle')} />
  }

  if (state === 'success') {
    const id = groupDigits(value)
    return <Success playerId={id} onContinue={() => (onLinked ? onLinked(id) : navigate?.('home'))} />
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#131313',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ScreenBg />
      <OnboardHeader />

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '0 26px',
      }}>
        <div style={{
          width: '100%',
          borderRadius: '28px',
          border: '0.7px solid transparent',
          background: CARD_BG,
          boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxSizing: 'border-box',
          padding: '24px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
            }}>
              {t('tgid.title')}
            </span>
            <p style={{
              margin: 0,
              color: '#AEAEAE',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: 1.35,
            }}>
              {loading ? t('tgid.subtitleLoading') : t('tgid.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              height: '62px',
              borderRadius: '20px',
              border: '1px solid transparent',
              background: error
                ? 'linear-gradient(#131313, #131313) padding-box, linear-gradient(#FF0000, #FF0000) border-box'
                : 'linear-gradient(#131313, #131313) padding-box, linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%) border-box',
              boxSizing: 'border-box',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                color: value ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400,
                fontSize: '20px',
                flexShrink: 0,
              }}>
                #
              </span>
              <input
                value={groupDigits(value)}
                onChange={(e) => { setValue(digitsOnly(e.target.value)); if (error) setState('idle') }}
                inputMode="numeric"
                placeholder={t('tgid.placeholder')}
                autoComplete="off"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontFamily: 'Roboto Flex, sans-serif',
                  fontWeight: 400,
                  fontSize: '20px',
                }}
                className="pid-input"
              />
            </div>

            {error && (
              <span style={{
                color: '#ED0000',
                fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
              }}>
                {t(errorKey)}
              </span>
            )}

            {state === 'errorLinked' && (
              <a href="#" style={{
                alignSelf: 'flex-start',
                color: '#FFFE45',
                fontFamily: 'Roboto Flex, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                textDecoration: 'none',
              }}>
                {t('tgid.support')}
              </a>
            )}
          </div>

          <ContinueButton onClick={submit} disabled={!canSubmit}>
            {loading ? t('tgid.linking') : t('tgid.continue')}
          </ContinueButton>
        </div>
      </div>

      {/* Figma'da bu qator kartadan uzoqda, ekran pastida turadi. */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '0 26px 45px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
      }}>
        <span style={{
          color: '#FFFFFF',
          opacity: 0.5,
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '12px',
        }}>
          {t('tgid.cantFind')}
        </span>
        <a
          href="#"
          style={{
            color: '#FFFE45',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}
        >
          {t('tgid.getHelp')}
        </a>
      </div>
    </div>
  )
}
