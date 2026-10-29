export const teams = ['RATS ESPORTS', 'RATS PUNGH', 'RATS IRON', 'RATS MCD', 'Asiatkompisarna', 'Medlem'] as const;
export const roles = ['Top', 'Jungle', 'Mid', 'Bot', 'Support', 'Fill'] as const;
export type Player = { id: string; game_name: string; tag_line: string; team: string; role: string };
export type Rank = { tier: string; rank: string; leaguePoints: number; wins: number; losses: number };
export type RecentMatch = { id: string; playedAt: string; result: 'WIN' | 'LOSE' | 'REMAKE'; champion: string; position: string; kills: number; deaths: number; assists: number; cs: number; opScore: number | null; opScoreRank: number | null };
export type RankPoint = { observed_at: string; tier: string; rank: string; lp: number; wins: number; losses: number; club_position: number | null };
export type PlayerHistory = { first: RankPoint | null; week: RankPoint | null; points: RankPoint[] };
export type Standing = Player & { stats: Rank | null; status: 'ranked' | 'unranked' | 'unavailable'; updatedAt: string | null; sourceUpdatedAt?: string | null; recentGames?: RecentMatch[]; awardGames?: RecentMatch[]; history?: PlayerHistory | null };
export const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
export function rankScore(stats: Rank | null) {
  if (!stats) return -1;
  const tier = tiers.indexOf(stats.tier);
  return tier * 1000000 + (tier < 7 ? ['IV', 'III', 'II', 'I'].indexOf(stats.rank) * 10000 : 0) + stats.leaguePoints;
}
export function winrate(stats: Rank) {
  const games = stats.wins + stats.losses;
  return games ? Math.round(stats.wins / games * 100) : 0;
}
export function opgg(player: Player) {
  return `https://www.op.gg/summoners/euw/${encodeURIComponent(player.game_name)}-${encodeURIComponent(player.tag_line)}`;
}
