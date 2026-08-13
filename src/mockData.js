export const mockUser = {
  id: 1,
  name: 'Alex Rank',
  rank: 37,
  xp: 1240,
  tokens: 5,
  avatar: null,
}

export const mockEvents = [
  {
    id: 1,
    status: 'live',
    timeLeft: '1H 20M LEFT',
    league: 'England. Premier League. Round 12',
    home: { name: 'Newcastle', icon: '/icons/new.svg' },
    away: { name: 'Man City', icon: '/icons/mc.svg' },
    coef: { home: 3.6, draw: 3.9, away: 2.1 },
  },
  {
    id: 2,
    status: 'upcoming',
    timeLeft: '3H 45M',
    league: 'Spain. La Liga. Round 14',
    home: { name: 'Barcelona', emoji: '🔴' },
    away: { name: 'Real Madrid', emoji: '⚪' },
    coef: { home: 2.1, draw: 3.5, away: 3.8 },
  },
  {
    id: 3,
    status: 'upcoming',
    timeLeft: '5H 10M',
    league: 'Germany. Bundesliga. Round 11',
    home: { name: 'Bayern', emoji: '🔴' },
    away: { name: 'Dortmund', emoji: '🟡' },
    coef: { home: 1.85, draw: 4.1, away: 4.5 },
  },
]

export const mockRewards = [
  {
    id: 1,
    title: 'Promo code',
    description: 'Get 100 free spins in Gates of Olympus',
    gradientLight: '#622380',
    gradientDark:  '#14071A',
  },
  {
    id: 2,
    title: 'Free Bet x2',
    description: 'Get 2 free predictions for Champions League',
    gradientLight: '#803F23',
    gradientDark:  '#1A1107',
  },
  {
    id: 3,
    title: 'Free Spin x5',
    description: 'Exclusive reward for top forecasters',
    gradientLight: '#622380',
    gradientDark:  '#14071A',
  },
]

export const mockLeaderboard = [
  { rank: 1, name: 'John Doe', pts: 2450, isMe: false },
  { rank: 2, name: 'Mike',     pts: 2100, isMe: false },
  { rank: 3, name: 'SaraK',   pts: 1980, isMe: false },
  { rank: 4, name: 'You',      pts: 1240, isMe: true  },
  { rank: 5, name: 'Alex',     pts: 1100, isMe: false },
  { rank: 6, name: 'Jordan',   pts:  980, isMe: false },
  { rank: 7, name: 'Chris',    pts:  870, isMe: false },
]

// Top Picks — ambassador tanlovlari. Figma'da uchala karta ham bitta
// plakat-namuna, shuning uchun 2 va 3-yozuvlar API paydo bo'lguncha to'ldiruvchi.
export const mockAnalyst = {
  name: 'Kate',
  avatar: '/icons/kate.webp',
  accuracy: '78%',
  instagram: 'https://instagram.com',
}

export const mockTopPicks = [
  {
    id: 1,
    startsIn: '1h 20m',
    analyst: mockAnalyst,
    league: 'England. Premiere League. Round 12',
    home: 'Newcastle',
    away: 'Man City',
    comment: 'Newcastle have won four home games in a row and City are missing two defenders. Value is on the hosts.',
    selection: '1- Newcastle win',
    odds: '3.6',
  },
  {
    id: 2,
    startsIn: '3h 45m',
    analyst: mockAnalyst,
    league: 'Spain. La Liga. Round 14',
    home: 'Sevilla',
    away: 'Villarreal',
    comment: 'Sevilla keep drawing at home and Villarreal travel without their top scorer. The draw looks underpriced.',
    selection: 'X - Draw',
    odds: '3.2',
  },
  {
    id: 3,
    startsIn: '5h 10m',
    analyst: mockAnalyst,
    league: 'Italy. Serie A. Round 13',
    home: 'Lazio',
    away: 'Bologna',
    comment: 'Bologna are unbeaten in five away matches while Lazio have lost three of their last four at home.',
    selection: '2 - Bologna win',
    odds: '2.8',
  },
]
