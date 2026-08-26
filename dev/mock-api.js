// Мок API только для локальной разработки: подключается из vite.config.js через
// configureServer, поэтому в прод-сборку не попадает. Нужен потому, что дев-сервер
// отдаёт на /api/* SPA-фолбэк (index.html), и все списки в интерфейсе пустые.

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

const ev = (id, sport, league, home, away, coef, extra = {}) => ({
  id,
  sport,
  league,
  home,
  away,
  homeIcon: null,
  awayIcon: null,
  status: 'live',
  timeLeft: '1H 20M LEFT',
  score: '1:0',
  coef: { home: coef[0], draw: coef[1], away: coef[2] },
  ...extra,
})

const LIVE = [
  ev(1, 'Football', 'England. Premier League. Round 12', 'Newcastle', 'Man City', [3.6, 3.9, 2.1]),
  ev(2, 'Football', 'Spain. La Liga. Round 14', 'Sevilla', 'Villarreal', [2.8, 3.2, 2.6], { score: '0:0' }),
  ev(3, 'Football', 'Italy. Serie A. Round 13', 'Lazio', 'Bologna', [2.2, 3.4, 3.1], { score: '2:1' }),
  ev(4, 'Basketball', 'NBA. Regular Season', 'Lakers', 'Celtics', [1.9, 0, 1.9], { score: '88:84' }),
  ev(5, 'Tennis', 'ATP. Masters 1000', 'Alcaraz', 'Sinner', [1.7, 0, 2.1], { score: '1:1' }),
  ev(6, 'Ice Hockey', 'NHL. Regular Season', 'Bruins', 'Rangers', [2.4, 4.1, 2.5], { score: '3:2' }),
  ev(7, 'Football', 'Germany. Bundesliga. Round 11', 'Leipzig', 'Freiburg', [1.8, 3.8, 4.0],
    { status: 'upcoming', timeLeft: 'Today 21:30', score: null }),
  ev(8, 'Football', 'France. Ligue 1. Round 12', 'Lyon', 'Nice', [2.5, 3.3, 2.7],
    { status: 'upcoming', timeLeft: 'Tomorrow 19:00', score: null }),
]

const LEADERBOARD = [
  { user_id: 'u1', login: 'John Doe', total_points: 2450, wins: 24, losses: 6, rank: 1, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u2', login: 'Marta K.', total_points: 2320, wins: 22, losses: 7, rank: 2, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u3', login: 'Sergey P.', total_points: 1980, wins: 19, losses: 9, rank: 3, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'demo', login: 'Alex Rank', total_points: 1240, wins: 12, losses: 6, rank: 4, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u5', login: 'Dilnoza A.', total_points: 1120, wins: 11, losses: 8, rank: 5, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u6', login: 'Pavel R.', total_points: 940, wins: 9, losses: 10, rank: 6, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u7', login: 'Aziza M.', total_points: 760, wins: 7, losses: 11, rank: 7, period: 'all', updated_at: daysAgo(0) },
  { user_id: 'u8', login: 'Igor V.', total_points: 540, wins: 5, losses: 12, rank: 8, period: 'all', updated_at: daysAgo(0) },
]

const PREDICTIONS = [
  { id: 'p1', user_id: 'demo', event_id: '1', sport: 'Football', league: 'Premier League', home_team: 'Newcastle', away_team: 'Man City', outcome: 'home', points: 1000, status: 'win', created_at: daysAgo(1) },
  { id: 'p2', user_id: 'demo', event_id: '2', sport: 'Football', league: 'La Liga', home_team: 'Sevilla', away_team: 'Villarreal', outcome: 'draw', points: 1000, status: 'win', created_at: daysAgo(3) },
  { id: 'p3', user_id: 'demo', event_id: '3', sport: 'Football', league: 'Serie A', home_team: 'Lazio', away_team: 'Bologna', outcome: 'away', points: 0, status: 'loss', created_at: daysAgo(5) },
  { id: 'p4', user_id: 'demo', event_id: '4', sport: 'Basketball', league: 'NBA', home_team: 'Lakers', away_team: 'Celtics', outcome: 'home', points: 0, status: 'waiting', created_at: daysAgo(6) },
  { id: 'p5', user_id: 'demo', event_id: '5', sport: 'Tennis', league: 'ATP Masters', home_team: 'Alcaraz', away_team: 'Sinner', outcome: 'home', points: 500, status: 'win', created_at: daysAgo(9) },
]

const QUESTS = [
  { id: 'q1', code: 'make_3_predictions', metric: 'predictions_made', target: 3,   progress: 3,   completed: true,  reward_kind: 'xp',     reward_value: 50 },
  { id: 'q2', code: 'predict_2_correct',  metric: 'predictions_won',  target: 2,   progress: 1,   completed: false, reward_kind: 'xp',     reward_value: 120 },
  { id: 'q3', code: 'spend_10_tokens',    metric: 'tokens_spent',     target: 10,  progress: 4,   completed: false, reward_kind: 'xp',     reward_value: 80 },
  { id: 'q4', code: 'login_5_days',       metric: 'login_streak',     target: 5,   progress: 5,   completed: true,  reward_kind: 'tokens', reward_value: 5 },
  { id: 'q5', code: 'reach_500_xp',       metric: 'xp_earned',        target: 500, progress: 200, completed: false, reward_kind: 'tokens', reward_value: 10 },
]

const PROMOS = [
  { id: '11111111-1111-1111-1111-111111111111', game: 'gates',   reward_text: 'Get 100 free spins in Gates of Olympus', claimed: false },
  { id: '22222222-2222-2222-2222-222222222222', game: 'aviator', reward_text: 'Get 100 free spins in Aviator',          claimed: false },
]

const PICKS = [
  {
    id: 'pick-1', league: 'Premier League', home_team: 'Newcastle', away_team: 'Man City',
    comment: 'Newcastle have won four home games in a row and City are missing two defenders. Value is on the hosts.',
    outcome: 'home', odds: 3.6, starts_at: new Date(Date.now() + 4800000).toISOString(), featured: true,
    analyst: { name: 'Kate', role: 'Sport Analyst', avatar: '/icons/kate.webp', accuracy: 78, instagram: 'https://instagram.com' },
  },
  {
    id: 'pick-2', league: 'La Liga', home_team: 'Sevilla', away_team: 'Villarreal',
    comment: 'Sevilla keep drawing at home and Villarreal travel without their top scorer. The draw looks underpriced.',
    outcome: 'draw', odds: 3.2, starts_at: new Date(Date.now() + 13500000).toISOString(), featured: false,
    analyst: { name: 'Kate', role: 'Sport Analyst', avatar: '/icons/kate.webp', accuracy: 78, instagram: 'https://instagram.com' },
  },
  {
    id: 'pick-3', league: 'Serie A', home_team: 'Lazio', away_team: 'Bologna',
    comment: 'Bologna are unbeaten in five away matches while Lazio have lost three of their last four at home.',
    outcome: 'away', odds: 2.8, starts_at: new Date(Date.now() + 18600000).toISOString(), featured: false,
    analyst: { name: 'Kate', role: 'Sport Analyst', avatar: '/icons/kate.webp', accuracy: 78, instagram: 'https://instagram.com' },
  },
]

const weekBounds = () => {
  const now = new Date()
  const offset = (now.getUTCDay() + 6) % 7
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset))
  const end = new Date(start.getTime() + 7 * 86400000)
  return { period_start: start.toISOString(), period_end: end.toISOString() }
}

const PROFILE = {
  id: 'demo',
  email: 'alex.rank@gmail.com',
  login: 'Alex Rank',
  region: 'Uzbekistan',
  points: 1240,
  tokens: 23,
  created_at: daysAgo(30),
}

const bySport = (name) => LIVE.filter((e) => e.sport === name)

const ROUTES = {
  '/api/live/all': () => LIVE,
  '/api/live/home': () => LIVE.slice(0, 3),
  '/api/live/football': () => bySport('Football'),
  '/api/live/matches': () => bySport('Football'),
  '/api/live/counts': () => ({ football: 4, basketball: 1, tennis: 1, hockey: 1 }),
  '/api/recommended': () => ({
    football: bySport('Football'),
    basketball: bySport('Basketball'),
    tennis: bySport('Tennis'),
    hockey: bySport('Ice Hockey'),
  }),
  '/api/leaderboard': () => LEADERBOARD,
  '/api/leaderboard/me': () => LEADERBOARD.find((e) => e.user_id === 'demo'),
  '/api/predictions': () => PREDICTIONS,
  '/api/quests': () => ({
    quests: QUESTS,
    done: QUESTS.filter((q) => q.completed).length,
    total: QUESTS.length,
    reward_claimed: false,
    ...weekBounds(),
  }),
  '/api/quests/claim': () => ({ claimed: true }),
  '/api/promos': () => ({ promos: PROMOS, new: PROMOS.filter((p) => !p.claimed).length }),
  '/api/promos/claim': () => ({ id: PROMOS[0].id, code: 'UZ150FS', claimed: true }),
  '/api/picks': () => PICKS,
  '/api/visit': () => ({ streak: 5 }),
  '/api/subscription': () => ({ subscribed: false, channel_url: 'https://t.me/telegram' }),
  // Развилка состояний экрана привязки: 1111111 — занят, 0000000 — сбой сети.
  '/api/telegram/link': (body) => {
    const id = String(body?.player_id || '')
    if (id === '0000000') return { __status: 503, error: 'service temporarily unavailable' }
    if (id === '1111111') return { __status: 409, error: 'player id already linked' }
    if (id !== '8240517') return { __status: 404, error: 'player id not found' }
    return { __status: 201, player_id: id }
  },
  '/api/tokens/spend': () => ({ tokens: 13 }),
  '/api/user/profile': () => PROFILE,
  '/api/status': () => ({ status: 'mock' }),
  '/api/health': () => ({ status: 'ok' }),
}

export default function mockApi() {
  return {
    name: 'dev-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (!path.startsWith('/api/')) return next()

        res.setHeader('Content-Type', 'application/json')

        const handler = ROUTES[path]
        if (!handler) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'no mock for ' + path }))
          return
        }

        let body = null
        if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
          } catch {
            body = {}
          }
        }

        // Ручка может задать код ответа через служебное поле __status.
        const result = handler(body)
        if (result && !Array.isArray(result) && '__status' in result) {
          const { __status, ...payload } = result
          res.statusCode = __status
          res.end(JSON.stringify(payload))
          return
        }
        res.end(JSON.stringify(result))
      })
    },
  }
}
