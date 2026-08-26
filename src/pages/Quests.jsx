import { useState, useEffect, useCallback } from 'react'
import BottomNav from '../components/BottomNav'
import { useT } from '../i18n'
import { apiFetch } from '../utils/api'
import imgReward from '/icons/ab33ad55.webp'
import icQuest from '/icons/q-ball.webp'

const YELLOW = '#FFFE45'
const GREEN = '#8FFF37'
const MUTED = '#AEAEAE'
const TRACK = 'rgba(255,255,255,0.05)'

const BORDER_GRADIENT = 'linear-gradient(180deg, rgba(160,160,160,0.15) 0%, rgba(211,211,211,0) 100%) border-box'
const CARD_BG = 'linear-gradient(#1B1B1D, #1B1B1D) padding-box, ' + BORDER_GRADIENT
// Bajarilgan kvest kartasi yashil tusga bo'yaladi.
const CARD_BG_DONE =
  'linear-gradient(rgba(143,255,55,0.06), rgba(143,255,55,0.06)) padding-box, ' +
  'linear-gradient(#1B1B1D, #1B1B1D) padding-box, ' + BORDER_GRADIENT

// Segmentli progress faqat qadamlar kam bo'lganda o'qiladi; aks holda uzluksiz chiziq.
const MAX_SEGMENTS = 5

// Тексты берём из локалей по коду квеста, числа — из API.
// Иконка одна на все карточки: в макете везде один и тот же кроп.

// Остаток недели в формате «2D 14H» — из period_end, который отдаёт API.
function resetIn(periodEnd) {
  if (!periodEnd) return null
  const ms = new Date(periodEnd) - Date.now()
  if (ms <= 0) return null
  const hours = Math.floor(ms / 3600000)
  return { label: `${Math.floor(hours / 24)}D ${String(hours % 24).padStart(2, '0')}H`, urgent: hours < 24 }
}

// Подпись прогресса зависит от метрики квеста.
const LABEL_KEY = {
  login_streak: 'quests.progressDays',
  xp_earned: 'quests.progressXp',
}

const QuestIcon = (
  <svg width="20" height="20" viewBox="0 0 14.01 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 12C13.17 12 13.338 11.956 13.487 11.873C13.636 11.79 13.761 11.671 13.85 11.526C13.94 11.381 13.991 11.215 13.998 11.045C14.006 10.875 13.97 10.705 13.894 10.553L12.118 7L13.894 3.447C13.97 3.295 14.006 3.125 13.998 2.955C13.991 2.785 13.94 2.619 13.85 2.474C13.761 2.329 13.636 2.21 13.487 2.127C13.338 2.044 13.17 2 13 2H2V1C2 0.735 1.895 0.48 1.707 0.293C1.52 0.105 1.265 0 1 0C0.735 0 0.48 0.105 0.293 0.293C0.105 0.48 0 0.735 0 1V19C0 19.265 0.105 19.52 0.293 19.707C0.48 19.895 0.735 20 1 20C1.265 20 1.52 19.895 1.707 19.707C1.895 19.52 2 19.265 2 19V12H13Z" fill="#FFFE45"/>
  </svg>
)

// "2 / 5" — sanoq rangli, maxraj so'nik. Bajarilganda sanoq yashil bo'ladi.
function Counter({ done, total, muted = MUTED, size = 14 }) {
  const complete = done >= total
  return (
    <span style={{
      fontFamily: 'Roboto Flex, sans-serif',
      fontWeight: 400,
      fontSize: `${size}px`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: complete ? GREEN : YELLOW }}>{done}</span>
      <span style={{ color: muted }}>{' / '}{total}</span>
    </span>
  )
}

function StatusTag({ done }) {
  const t = useT()
  const rgb = done ? '143,255,55' : '255,254,69'

  return (
    <span style={{
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      borderRadius: '36px',
      border: `0.5px solid rgba(${rgb},0.4)`,
      background: `rgba(${rgb},0.1)`,
      color: done ? GREEN : YELLOW,
      fontFamily: 'Roboto Flex, sans-serif',
      fontWeight: 500,
      fontSize: '10px',
      lineHeight: 1.1,
      letterSpacing: '0.2px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {done ? t('quests.tagDone') : t('quests.tagProgress')}
    </span>
  )
}

function QuestProgress({ done, total }) {
  const complete = done >= total
  const fill = complete ? GREEN : YELLOW

  if (total <= MAX_SEGMENTS) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1,
            height: '6px',
            borderRadius: '19px',
            background: i < done ? fill : TRACK,
          }} />
        ))}
      </div>
    )
  }

  const pct = Math.min(100, Math.max(0, (done / total) * 100))
  return (
    <div style={{ height: '6px', borderRadius: '19px', background: TRACK, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '19px', background: fill }} />
    </div>
  )
}

// Bajarilgan kvest bosilganda tabrik oynasi ochiladi (Quest_Popup_375).
function QuestCard({ quest, onOpen }) {
  const t = useT()
  const { code, progress, target, reward_kind: kind, reward_value: value, metric } = quest
  const completed = progress >= target
  const labelKey = LABEL_KEY[metric] || 'quests.progressOf'
  const reward = `+${value} ${kind === 'tokens' ? t('quests.tokens') : t('common.xp')}`

  return (
    <div
      onClick={completed ? onOpen : undefined}
      style={{
        borderRadius: '20px',
        border: '0.7px solid transparent',
        background: completed ? CARD_BG_DONE : CARD_BG,
        boxSizing: 'border-box',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: completed ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          flexShrink: 0,
          borderRadius: '13px',
          border: '0.8px solid rgba(255,254,69,0.4)',
          background: '#0E0D0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          <img src={icQuest} alt="" width="43" height="43" decoding="async" style={{ display: 'block', objectFit: 'contain' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              flex: 1,
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: 1.15,
            }}>
              {t(`quests.${code}.title`)}
            </span>
            <StatusTag done={completed} />
          </div>

          <p style={{
            margin: 0,
            color: MUTED,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: 1.35,
          }}>
            {t(`quests.${code}.desc`)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <QuestProgress done={progress} total={target} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            flex: 1,
            color: MUTED,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
          }}>
            {t(labelKey, { done: progress, total: target })}
          </span>
          <span style={{
            color: completed ? GREEN : YELLOW,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            {completed ? t('quests.earned', { reward }) : reward}
          </span>
        </div>
      </div>
    </div>
  )
}

function QuestPopup({ quest, onClose }) {
  const t = useT()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
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
            'radial-gradient(47.9% 34.3% at 50% 67.2%, rgba(255,196,0,0.112) 0%, rgba(0,0,0,0) 100%) padding-box, ' +
            'linear-gradient(#1B1B1D, #1B1B1D) padding-box, ' + BORDER_GRADIENT,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <button
          onClick={onClose}
          aria-label={t('quests.close')}
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L15 15M15 1L1 15" stroke="rgba(114,119,124,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <span style={{
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '22px',
          lineHeight: 1.15,
          textAlign: 'center',
        }}>
          {t('quests.popupTitle')}
        </span>

        <div style={{
          width: '92px',
          height: '92px',
          flexShrink: 0,
          borderRadius: '23px',
          border: '1.4px solid rgba(255,254,69,0.4)',
          background: '#0E0D0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          <img src={imgReward} alt="" width="76" height="73" decoding="async" style={{ display: 'block' }} />
        </div>

        <p style={{
          margin: 0,
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: 1.2,
          textAlign: 'center',
        }}>
          {t('quests.popupBody', { title: t(`quests.${quest.code}.title`) })}
        </p>
      </div>
    </div>
  )
}

function WeekProgress({ done, total, reset, canClaim, onClaim }) {
  const t = useT()
  const complete = done >= total
  const pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0

  return (
    <div style={{
      borderRadius: '20px',
      border: '0.7px solid transparent',
      background: CARD_BG,
      boxSizing: 'border-box',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              flex: 1,
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
            }}>
              {t('quests.weekProgress')}
            </span>
            <Counter done={done} total={total} size={14} />
          </div>
          <div style={{ height: '6px', borderRadius: '19px', background: TRACK, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '19px', background: complete ? GREEN : YELLOW }} />
          </div>
        </div>

        <div style={{ width: '1px', height: '36px', background: 'rgba(114,119,124,0.2)', flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span style={{
            color: MUTED,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
          }}>
            {t('quests.resetIn')}
          </span>
          <span style={{
            color: reset?.urgent ? '#FF0000' : YELLOW,
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: reset?.urgent ? '16px' : '12px',
            whiteSpace: 'nowrap',
          }}>
            {reset?.label || '—'}
          </span>
        </div>
      </div>

      {canClaim && (
        <button
          onClick={onClaim}
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
            fontSize: '14px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('quests.claim')}
        </button>
      )}
    </div>
  )
}

export default function Quests({ navigate }) {
  const t = useT()
  const [popupQuest, setPopupQuest] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/quests')
      if (res.ok) setData(await res.json())
    } catch {
      // список останется пустым — покажем заглушку
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const claim = async () => {
    try {
      const res = await apiFetch('/api/quests/claim', { method: 'POST' })
      if (res.ok) load()
    } catch {}
  }

  const quests = data?.quests || []
  const done = data?.done ?? 0
  const total = data?.total ?? quests.length
  const reset = resetIn(data?.period_end)
  const canClaim = total > 0 && done >= total && !data?.reward_claimed

  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px' }}>
        <button
          onClick={() => navigate?.('promo')}
          style={{ width: '24px', height: '24px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}
        >
          <img src="/icons/i_arrowUp.svg" alt="Back" style={{ width: '20px', height: '20px' }} />
        </button>
        <span style={{
          flex: 1,
          textAlign: 'center',
          color: '#FFFFFF',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
        }}>
          {t('quests.title')}
        </span>
        <button style={{ width: '24px', height: '24px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>
          <img src="/icons/i_info.svg" alt="Info" style={{ width: '22px', height: '22px' }} />
        </button>
      </div>
      <div style={{ height: '1px', background: 'rgba(114,119,124,0.2)' }} />

      <div style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <WeekProgress done={done} total={total} reset={reset} canClaim={canClaim} onClaim={claim} />

        <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {QuestIcon}
          <span style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
          }}>
            {t('quests.weekly')}
          </span>
          <span style={{
            flex: 1,
            textAlign: 'right',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
          }}>
            {t('quests.count', { count: total })}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            {t('common.loading')}
          </div>
        ) : quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} onOpen={() => setPopupQuest(quest)} />
        ))}
      </div>

      <BottomNav active="promo" onNavigate={navigate} />

      {popupQuest && <QuestPopup quest={popupQuest} onClose={() => setPopupQuest(null)} />}
    </div>
  )
}
