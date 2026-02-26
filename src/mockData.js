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
    title: 'Free Bet x2',
    description: 'Get 2 free predictions for Champions League',
    color: 'from-purple-900 to-purple-800',
  },
  {
    id: 2,
    title: 'Free Bet x3',
    description: 'Get 3 free predictions for La Liga',
    color: 'from-indigo-900 to-indigo-800',
  },
  {
    id: 3,
    title: 'Free Spin x5',
    description: 'Exclusive reward for top forecasters',
    color: 'from-rose-900 to-rose-800',
  },
]

export const mockLeaderboard = [
  { rank: 1,  name: 'John Doe', pts: 2450, avatar: '🟢', isMe: false },
  { rank: 2,  name: 'Mike',     pts: 2100, avatar: '🟣', isMe: false },
  { rank: 3,  name: 'SaraK',   pts: 1980, avatar: '🔵', isMe: false },
  { rank: 37, name: 'You',      pts: 1240, avatar: null, isMe: true  },
]
