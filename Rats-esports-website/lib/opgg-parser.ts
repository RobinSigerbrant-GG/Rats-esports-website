import type { Rank } from './soloq';

const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
export function parseOpgg(data: unknown, name: string, tag: string): { stats: Rank | null; sourceUpdatedAt: string | null } {
  if (!data || typeof data !== 'object') throw new Error('Invalid OP.GG profile');
  const profile = data as { identity?: { gameName?: string; tagline?: string }; context?: { region?: string }; rank?: { entries?: { queueType: string; tier: string; division: number; lp: number; wins: number; losses: number }[] }; freshness?: { summonerUpdatedAt?: string } };
  if (profile.context?.region !== 'euw' || profile.identity?.gameName?.toLowerCase() !== name.toLowerCase() || profile.identity?.tagline?.toLowerCase() !== tag.toLowerCase() || !Array.isArray(profile.rank?.entries)) throw new Error('Unrecognized OP.GG profile');
  const date = profile.freshness?.summonerUpdatedAt;
  const sourceUpdatedAt = date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null;
  const solo = profile.rank.entries.find(entry => entry.queueType === 'SOLORANKED');
  if (!solo) return { stats: null, sourceUpdatedAt };
  const tier = solo.tier?.split(' ')[0].toUpperCase();
  if (tier === 'UNRANKED') return { stats: null, sourceUpdatedAt };
  if (!tiers.includes(tier) || ![solo.lp, solo.wins, solo.losses].every(value => Number.isSafeInteger(value) && value >= 0) || (tiers.indexOf(tier) < 7 && ![1,2,3,4].includes(solo.division))) throw new Error('Invalid OP.GG ranked statistics');
  return { stats: { tier, rank: tiers.indexOf(tier) >= 7 ? 'I' : ['I','II','III','IV'][solo.division - 1], leaguePoints: solo.lp, wins: solo.wins, losses: solo.losses }, sourceUpdatedAt };
}
