import { useT } from '../i18n'

// Card_Top Picks. `featured` — "Pick of the day" ko'rinishi: sariq ramka,
// sariq tus va yuqorida yorliq bilan qolgan vaqt (Figma'da 343x321 va 343x285).
const BASE_BG = 'linear-gradient(119deg, rgba(27,27,29,0.7) 0%, rgba(79,79,79,0.3) 100%)'
const TINT_BG = 'linear-gradient(44deg, rgba(255,254,69,0.1) 0%, rgba(0,0,0,0) 100%)'
const FEATURED_BORDER = 'linear-gradient(46deg, #FFFE45 0%, #2B2B10 100%) border-box'

// "Today's prediction" bo'limi sarlavhasidagi belgi.
export const PredictionIcon = (
  <svg width="20" height="20" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 10C0.718 10 0.48 9.904 0.289 9.712C0.098 9.52 0.002 9.283 0.001 9C0 8.717 0.096 8.48 0.289 8.288C0.482 8.096 0.719 8 1.001 8H6.001C6.284 8 6.522 8.096 6.714 8.288C6.906 8.48 7.002 8.717 7.001 9C7 9.283 6.904 9.52 6.713 9.713C6.522 9.906 6.284 10.001 6.001 10H1ZM1 6C0.718 6 0.48 5.904 0.289 5.712C0.098 5.52 0.002 5.283 0.001 5C0 4.717 0.096 4.48 0.289 4.288C0.482 4.096 0.719 4 1.001 4H8.001C8.284 4 8.522 4.096 8.714 4.288C8.906 4.48 9.002 4.717 9.001 5C9 5.283 8.904 5.52 8.713 5.713C8.522 5.906 8.284 6.001 8.001 6H1ZM1 2C0.718 2 0.48 1.904 0.289 1.712C0.098 1.52 0.002 1.283 0.001 1C0 0.717 0.096 0.48 0.289 0.288C0.482 0.096 0.719 0 1.001 0H8.001C8.284 0 8.522 0.096 8.714 0.288C8.906 0.48 9.002 0.717 9.001 1C9 1.283 8.904 1.52 8.713 1.713C8.522 1.906 8.284 2.001 8.001 2H1ZM13.6 16L9.35 11.75C9.15 11.55 9.05 11.3 9.05 11C9.05 10.7 9.15 10.45 9.35 10.25C9.55 10.05 9.8 9.95 10.1 9.95C10.4 9.95 10.65 10.05 10.85 10.25L13.6 13L17.75 8.85C17.95 8.65 18.196 8.554 18.488 8.562C18.78 8.57 19.026 8.674 19.226 8.874C19.409 9.074 19.504 9.32 19.512 9.612C19.52 9.904 19.425 10.15 19.226 10.35L13.6 16Z" fill="#E20000"/>
  </svg>
)

const StarIcon = (
  <svg width="12" height="12" viewBox="0 0 11.44 10.91" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.719 9.133L2.953 10.8C2.83 10.878 2.703 10.911 2.569 10.9C2.436 10.889 2.319 10.844 2.219 10.767C2.119 10.689 2.041 10.592 1.986 10.475C1.93 10.359 1.919 10.228 1.953 10.083L2.686 6.933L0.236 4.817C0.125 4.717 0.055 4.603 0.028 4.475C0 4.347 0.009 4.222 0.053 4.1C0.097 3.978 0.163 3.878 0.253 3.8C0.342 3.722 0.464 3.672 0.619 3.65L3.853 3.367L5.103 0.4C5.158 0.267 5.244 0.167 5.361 0.1C5.478 0.033 5.597 0 5.719 0C5.841 0 5.96 0.033 6.077 0.1C6.194 0.167 6.28 0.267 6.335 0.4L7.585 3.367L10.819 3.65C10.974 3.672 11.096 3.722 11.185 3.8C11.275 3.878 11.341 3.978 11.385 4.1C11.429 4.222 11.438 4.347 11.41 4.475C11.383 4.603 11.313 4.717 11.202 4.817L8.752 6.933L9.485 10.083C9.519 10.228 9.508 10.359 9.452 10.475C9.397 10.592 9.319 10.689 9.219 10.767C9.119 10.844 9.002 10.889 8.869 10.9C8.735 10.911 8.608 10.878 8.485 10.8L5.719 9.133Z" fill="#0E0D0D"/>
  </svg>
)

const PICK_LABEL = { home: 'Home Win', draw: 'Draw', away: 'Away Win' }

const ClockIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="5" stroke="#FFFE45" strokeWidth="1.2"/>
    <path d="M6 3.2V6L7.9 7.2" stroke="#FFFE45" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

// «1h 20m» до начала матча — из starts_at, который отдаёт API.
function startsIn(iso) {
  if (!iso) return ''
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return ''
  const mins = Math.floor(ms / 60000)
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}

// Figma'da sarlavhadagi "vs" so'ni so'nikroq rangda.
function MatchTitle({ home, away }) {
  return (
    <span style={{
      color: '#FFFFFF',
      fontFamily: 'Roboto Flex, sans-serif',
      fontWeight: 700,
      fontSize: '20px',
      lineHeight: 1.15,
      textAlign: 'center',
    }}>
      {home} <span style={{ color: '#AEAEAE' }}>vs</span> {away}
    </span>
  )
}

export default function TopPickCard({ pick, featured = false, onPredict }) {
  const t = useT()

  return (
    <div style={{
      borderRadius: '28px',
      border: featured ? '0.7px solid transparent' : 'none',
      background: featured
        ? `${TINT_BG} padding-box, ${BASE_BG} padding-box, ${FEATURED_BORDER}`
        : BASE_BG,
      boxShadow: '0px 20px 60px 0px rgba(0,0,0,0.1)',
      boxSizing: 'border-box',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {featured && (
        <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            padding: '4px 8px',
            borderRadius: '60px',
            background: '#FFFE45',
            color: '#0E0D0D',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '12px',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}>
            {StarIcon}
            {t('picks.pickOfDay')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {ClockIcon}
            <span style={{
              color: '#FFFE45',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 500,
              fontSize: '10px',
              letterSpacing: '0.2px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {startsIn(pick.starts_at)}
            </span>
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src={pick.analyst.avatar}
          alt=""
          width="46"
          height="46"
          decoding="async"
          style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              {pick.analyst.name}
            </span>
            <span style={{
              color: '#AEAEAE',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
            }}>
              {t('picks.analyst')}
            </span>
          </div>
          <span style={{
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
          }}>
            {pick.league}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <MatchTitle home={pick.home_team} away={pick.away_team} />
        <p style={{
          margin: 0,
          color: '#AEAEAE',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: 1.35,
        }}>
          {pick.comment}
        </p>
      </div>

      <div style={{
        background: '#131313',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          <span style={{
            color: '#686868',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
            textTransform: 'uppercase',
          }}>
            {t('picks.prediction', { name: pick.analyst.name })}
          </span>
          <span style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
          }}>
            {PICK_LABEL[pick.outcome] || pick.outcome}
          </span>
        </div>
        <span style={{
          color: '#FFFE45',
          fontFamily: 'Roboto Flex, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          whiteSpace: 'nowrap',
        }}>
          {pick.odds}
        </span>
      </div>

      <button
        onClick={onPredict}
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
        {t('picks.makePrediction')}
      </button>
    </div>
  )
}
