import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { apiFetch, clearSession } from '../utils/api'
import { useT } from '../i18n'
import BottomNav from '../components/BottomNav'
import iconTapbar from '/icons/Icon_Tapbar.svg'
import iconPosition from '/icons/Iocn_Tapbar-2.svg'
import iconWinrate from '/icons/Icon_Tapbar-3.svg'
import iconEmail from '/icons/Icon.svg'
import iconLocation from '/icons/basil_location-solid.svg'
import iconEdit from '/icons/tdesign_edit-filled.svg'
import iconTelegram from '/icons/Telegram.svg'
import iconGroup from '/icons/Group-2.svg'
import iconLogout from '/icons/cuida_logout-outline.svg'

// Profile Statistick (Figma: Profile_375). Карточка r=20, pad 20, AL vertical gap 12.
const CARD_BG =
  'linear-gradient(180deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%) padding-box, ' +
  'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'

const ROW_BORDER = 'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'

// Result 302x68: фон #131313, r=12, pad 12, gap 16.
function InfoRow({ icon, iconSize = 22, label, value, valueColor = '#FFFFFF', rightSlot, valuePrefix }) {
  return (
    <div style={{
      height: '68px',
      background: '#131313',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      gap: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        background: '#1B1B1D',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={icon} alt="" style={{ width: `${iconSize}px`, height: `${iconSize}px`, objectFit: 'contain' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
        <span style={{
          color: '#686868',
          fontFamily: 'Roboto Flex, sans-serif',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: 1.1,
        }}>
          {label}
        </span>
        {value !== '' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {valuePrefix}
            <span style={{
              color: valueColor,
              fontFamily: 'Roboto Flex, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: 1.1,
            }}>
              {value}
            </span>
          </div>
        )}
      </div>

      {rightSlot}
    </div>
  )
}

// Table_Row 147x64: фон #1B1B1D, r=16, pad 12, gap 8.
function StatTile({ icon, iconBg, label, value }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      height: '64px',
      borderRadius: '16px',
      border: '1px solid transparent',
      background: `linear-gradient(#1B1B1D, #1B1B1D) padding-box, ${ROW_BORDER}`,
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      gap: '8px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '60px',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={icon} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: 1.1,
        }}>
          {value}
        </span>
      </div>
    </div>
  )
}

export default function Profile({ navigate, user }) {
  const t = useT()
  const [sub, setSub] = useState(null)
  const [stats, setStats] = useState(null)

  const loadSubscription = () => {
    apiFetch('/api/subscription')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setSub(data) })
      .catch(() => {})
  }

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/leaderboard/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setStats(data) })
      .catch(() => {})
    loadSubscription()
    return () => { cancelled = true }
  }, [])

  const subscribed = sub?.subscribed === true

  // Кнопка Subscribe уводит в канал; вернувшись, пользователь перепроверяет статус.
  const handleSubscribe = () => {
    if (sub?.channel_url) {
      const tg = window.Telegram?.WebApp
      if (tg?.openTelegramLink) tg.openTelegramLink(sub.channel_url)
      else window.open(sub.channel_url, '_blank', 'noopener')
    }
    setTimeout(loadSubscription, 1500)
  }

  const handleDelete = async () => {
    if (!window.confirm(t('profile.deleteConfirm'))) return
    try {
      const res = await apiFetch('/api/user/profile', { method: 'DELETE' })
      if (res.ok) {
        clearSession()
        window.location.reload()
      }
    } catch {}
  }

  const position = stats?.rank > 0 ? `#${stats.rank}` : '—'
  const total = (stats?.wins ?? 0) + (stats?.losses ?? 0)
  const winRate = total > 0 ? `${Math.round((stats.wins / total) * 100)}%` : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <Header user={user} />

      <div style={{ padding: '18px 16px 0' }}>
        <div style={{
          width: '100%',
          borderRadius: '20px',
          border: '0.7px solid transparent',
          background: CARD_BG,
          boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img src={iconTapbar} alt="" style={{ width: '20px', height: '20px' }} />
            <span style={{
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              {t('profile.info')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <StatTile
              icon={iconPosition}
              iconBg="rgba(255,254,69,0.05)"
              label={t('common.yourPosition')}
              value={position}
            />
            <StatTile
              icon={iconWinrate}
              iconBg="rgba(85,182,133,0.05)"
              label={t('common.winRate')}
              value={winRate}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <InfoRow
              icon={iconEmail}
              iconSize={22}
              label={t('common.email')}
              value={user?.email || '—'}
            />

            <InfoRow
              icon={iconLocation}
              iconSize={24}
              label={t('profile.region')}
              value={user?.region || '—'}
              rightSlot={
                <img src={iconEdit} alt="" style={{ width: '22px', height: '22px', flexShrink: 0 }} />
              }
            />

            <InfoRow
              icon={iconTelegram}
              iconSize={20}
              label={t('profile.subscription')}
              value={subscribed ? t('common.active') : t('profile.inactive')}
              valueColor={subscribed ? '#55B685' : '#FF4D00'}
              valuePrefix={subscribed ? (
                <img src={iconGroup} alt="" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              ) : null}
              rightSlot={subscribed ? null : (
                <button
                  onClick={handleSubscribe}
                  style={{
                    height: '29px',
                    padding: '8px 20px',
                    background: 'linear-gradient(#FFFE45, #FFFE45) padding-box, ' + ROW_BORDER,
                    borderRadius: '8px',
                    border: '0.5px solid transparent',
                    color: '#0E0D0D',
                    fontFamily: 'Roboto Flex, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  {t('profile.subscribe')}
                </button>
              )}
            />

            <InfoRow
              icon={iconLogout}
              iconSize={24}
              label={t('profile.deleteBot')}
              value=""
              rightSlot={
                <button
                  onClick={handleDelete}
                  style={{
                    height: '29px',
                    padding: '8px 20px',
                    background: 'linear-gradient(#555555, #555555) padding-box, ' + ROW_BORDER,
                    borderRadius: '8px',
                    border: '0.5px solid transparent',
                    color: '#0E0D0D',
                    fontFamily: 'Roboto Flex, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  {t('profile.delete')}
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
