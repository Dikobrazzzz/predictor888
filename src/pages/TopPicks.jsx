import BottomNav from '../components/BottomNav'
import TopPickCard, { PredictionIcon } from '../components/TopPickCard'
import { useT } from '../i18n'
import { mockAnalyst, mockTopPicks } from '../mockData'

const ArrowIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3.5L10.5 8L6 12.5" stroke="#AEAEAE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Ambassador haqidagi tasma — sarlavha ostidagi qatorda.
function AnalystStrip({ analyst }) {
  const t = useT()
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(114,119,124,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={analyst.avatar}
          alt=""
          width="62"
          height="62"
          decoding="async"
          style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{
              color: '#FFFFFF',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              {analyst.name}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: '36px',
              border: '0.5px solid rgba(255,254,69,0.4)',
              background: 'rgba(255,254,69,0.1)',
              color: '#FFFE45',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 400,
              fontSize: '10px',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {t('picks.ambassador')}
            </span>
          </div>

          <span style={{
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <span style={{ color: '#FFFE45' }}>{analyst.accuracy}</span>{' '}
            {t('picks.accuracy')}
          </span>

          <a
            href={analyst.instagram}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <span style={{
              color: '#AEAEAE',
              fontFamily: 'Roboto Flex, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
            }}>
              {t('picks.follow', { name: analyst.name })}
            </span>
            {ArrowIcon}
          </a>
        </div>
      </div>
    </div>
  )
}

export default function TopPicks({ navigate }) {
  const t = useT()
  const [featured, ...rest] = mockTopPicks

  return (
    <div style={{ minHeight: '100vh', background: '#131313', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px' }}>
        <button
          onClick={() => navigate?.('events')}
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
          {t('picks.title')}
        </span>
        <button style={{ width: '24px', height: '24px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>
          <img src="/icons/i_info.svg" alt="Info" style={{ width: '22px', height: '22px' }} />
        </button>
      </div>
      <div style={{ height: '1px', background: 'rgba(114,119,124,0.2)' }} />

      <AnalystStrip analyst={mockAnalyst} />

      <div style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {PredictionIcon}
          <span style={{
            color: '#FFFFFF',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
          }}>
            {t('picks.todaysPrediction')}
          </span>
          <span style={{
            flex: 1,
            textAlign: 'right',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Roboto Flex, sans-serif',
            fontWeight: 400,
            fontSize: '12px',
          }}>
            {t('picks.matches', { count: mockTopPicks.length })}
          </span>
        </div>

        <TopPickCard pick={featured} featured onPredict={() => navigate?.('makePrediction')} />
        {rest.map((pick) => (
          <TopPickCard key={pick.id} pick={pick} onPredict={() => navigate?.('makePrediction')} />
        ))}
      </div>

      <BottomNav active="events" onNavigate={navigate} />
    </div>
  )
}
