import { unstable_cache } from 'next/cache';
import { errorResponse, players } from '../../../../lib/soloq-server';
import type { Rank, Standing } from '../../../../lib/soloq';
import { parseOpgg } from '../../../../lib/opgg-parser';

export const maxDuration = 60;
type League = Rank & { queueType: string };
class RiotError extends Error { constructor(public status: number) { super('Riot unavailable'); } }
async function riot(path: string, platform: string, revalidate: number) {
  const response = await fetch(`https://${platform}.api.riotgames.com/${path}`, {
    headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! }, next: { revalidate }, signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new RiotError(response.status);
  return response.json();
}
const ranking = unstable_cache(async (name: string, tag: string) => {
  const account = await riot(`riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, 'europe', 86400);
  const entries: League[] = await riot(`lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`, 'euw1', 900);
  const solo = entries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
  return { stats: solo ? { tier: solo.tier, rank: solo.rank, leaguePoints: solo.leaguePoints, wins: solo.wins, losses: solo.losses } : null, updatedAt: new Date().toISOString() };
}, ['soloq-rank-v1'], { revalidate: 900 });

const opggRanking = unstable_cache(async (name: string, tag: string) => {
  const url = `https://op.gg/lol/summoners/euw/${encodeURIComponent(name)}-${encodeURIComponent(tag)}/ai.json`;
  const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new RiotError(response.status);
  const parsed = parseOpgg(await response.json(), name, tag);
  return { ...parsed, updatedAt: new Date().toISOString() };
}, ['soloq-opgg-v1'], { revalidate: 900 });

export async function GET() {
  try {
    const roster = await players();
    const source = process.env.RIOT_API_KEY ? 'riot' : 'opgg';
    const result: Standing[] = roster.map(player => ({ ...player, stats: null, status: 'unavailable', updatedAt: null }));
    let blocked = false;
    const started = Date.now();
    {
      for (let i = 0; i < roster.length; i += 2) {
        if (blocked || Date.now() - started > 44000) break;
        await Promise.all(roster.slice(i, i + 2).map(async (player, offset) => {
          try {
            const data = await (source === 'riot' ? ranking : opggRanking)(player.game_name, player.tag_line);
            result[i + offset] = { ...player, ...data, status: data.stats ? 'ranked' : 'unranked' };
          } catch (error) {
            if (error instanceof RiotError && [401, 403, 429].includes(error.status)) blocked = true;
          }
        }));
        if (i + 2 < roster.length && !blocked) await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    return Response.json({ players: result, configured: true, source }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
