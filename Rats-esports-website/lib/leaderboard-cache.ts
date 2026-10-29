import type { Standing, Rank } from './soloq';
import { normalizeMatches, normalizeHistory, awardMatches } from './soloq-analysis.ts';

export const leaderboardCacheKey = 'rats:soloq:leaderboard:v1';
export type LeaderboardSnapshot = { version: 1; savedAt: string; source: 'opgg' | 'riot'; players: Standing[] };
const isDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const nullableDate = (value: unknown) => value === null || isDate(value);
function isRank(value: unknown): value is Rank {
  if (!value || typeof value !== 'object') return false;
  const r = value as Rank;
  return ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'].includes(r.tier) && ['I','II','III','IV'].includes(r.rank) && [r.leaguePoints,r.wins,r.losses].every(n => Number.isSafeInteger(n) && n >= 0);
}
// Treat stored data as untrusted and retain only public leaderboard fields.
export function parseLeaderboardSnapshot(raw: string | null): LeaderboardSnapshot | null {
  if (!raw || raw.length > 2000000) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !isDate(value.savedAt) || !['opgg','riot'].includes(value.source) || !Array.isArray(value.players) || value.players.length > 1000) return null;
    const players: Standing[] = value.players.map((p: Standing) => {
      if (!p || typeof p.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(p.id) || ![p.game_name,p.tag_line,p.team,p.role].every(v => typeof v === 'string' && v.length > 0 && v.length <= 100) || !['ranked','unranked','unavailable'].includes(p.status) || !nullableDate(p.updatedAt) || !nullableDate(p.sourceUpdatedAt ?? null)) throw new Error('Invalid player');
      if ((p.status === 'ranked' && !isRank(p.stats)) || (p.status !== 'ranked' && p.stats !== null)) throw new Error('Invalid rank');
      const stats = p.stats ? { tier:p.stats.tier, rank:p.stats.rank, leaguePoints:p.stats.leaguePoints, wins:p.stats.wins, losses:p.stats.losses } : null;
      return { id:p.id, game_name:p.game_name, tag_line:p.tag_line, team:p.team, role:p.role, stats, status:p.status, updatedAt:p.updatedAt, sourceUpdatedAt:p.sourceUpdatedAt ?? null, ...(p.recentGames!==undefined?{recentGames:normalizeMatches(p.recentGames)}:{}), ...(p.awardGames!==undefined?{awardGames:awardMatches(normalizeMatches(p.awardGames,100))}:{}), ...(p.history!==undefined?{history:normalizeHistory(p.history)}:{}) };
    });
    if (new Set(players.map(p => p.id)).size !== players.length) return null;
    return { version:1, savedAt:value.savedAt, source:value.source, players };
  } catch { return null; }
}
export function saveLeaderboardSnapshot(storage: Pick<Storage,'setItem'>, snapshot: LeaderboardSnapshot) {
  try { storage.setItem(leaderboardCacheKey, JSON.stringify(snapshot)); return true; }
  catch { return false; } // Disabled storage or a full quota must not break the live list.
}
