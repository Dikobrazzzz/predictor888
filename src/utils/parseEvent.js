export default function parseEvent(d) {
  return {
    id: d.id,
    status: d.status || 'live',
    timeLeft: d.timeLeft || 'LIVE',
    league: d.league || '',
    home: { name: d.home, icon: d.homeIcon || null },
    away: { name: d.away, icon: d.awayIcon || null },
    score: d.score || null,
    sport: d.sport || '',
    coef: {
      home: d.coef?.home ?? 0,
      draw: d.coef?.draw ?? 0,
      away: d.coef?.away ?? 0,
    },
  }
}
