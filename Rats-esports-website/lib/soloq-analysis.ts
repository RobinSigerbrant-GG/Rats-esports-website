import { tiers, type RecentMatch, type Standing, type Rank, type RankPoint, type PlayerHistory } from './soloq.ts';

export const minimumAwardGames = 5;
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 160;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 100000;
export function normalizeMatches(input: unknown): RecentMatch[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.slice(0,100).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const m = item as Record<string, unknown>;
    // Source payloads use queueType; saved snapshots have already been restricted to Solo/Duo.
    if (m.queueType !== undefined && m.queueType !== 'SOLORANKED') return [];
    if (!text(m.id) || seen.has(m.id) || !date(m.playedAt) || !text(m.champion) || !['WIN','LOSE','REMAKE'].includes(String(m.result)) || ![m.kills,m.deaths,m.assists,m.cs].every(count)) return [];
    seen.add(m.id);
    return [{ id:m.id, playedAt:new Date(m.playedAt).toISOString(), champion:m.champion, position:text(m.position) ? m.position : 'UNKNOWN', result:m.result as RecentMatch['result'], kills:m.kills as number, deaths:m.deaths as number, assists:m.assists as number, cs:m.cs as number, opScore:typeof m.opScore === 'number' && Number.isFinite(m.opScore) && m.opScore >= 0 && m.opScore <= 10 ? m.opScore : null, opScoreRank:count(m.opScoreRank) && m.opScoreRank >= 1 && m.opScoreRank <= 10 ? m.opScoreRank : null }];
  }).sort((a,b) => Date.parse(b.playedAt)-Date.parse(a.playedAt)).slice(0,10);
}
export function analyze(matches: RecentMatch[] = []) {
  const games = matches.filter(m => m.result !== 'REMAKE');
  const n = games.length;
  const total = (key: 'kills'|'deaths'|'assists') => games.reduce((s,m) => s+m[key],0);
  const wins = games.filter(m => m.result === 'WIN').length;
  let streak = 0;
  for (const m of games) { if (m.result !== 'WIN') break; streak++; }
  const championCounts = new Map<string,{name:string;games:number;wins:number}>();
  const positions = new Map<string,number>();
  for (const m of games) {
    const key=m.champion.toLowerCase(); const c=championCounts.get(key) ?? {name:m.champion,games:0,wins:0}; c.games++; c.wins+=Number(m.result==='WIN'); championCounts.set(key,c);
    positions.set(m.position,(positions.get(m.position)??0)+1);
  }
  const champions=[...championCounts.values()].sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name));
  const scores=games.flatMap(m=>m.opScore===null?[]:[m.opScore]);
  return { n,wins,winRate:n?wins/n:0,streak,streakCapped:n>0&&streak===n,avgKills:n?total('kills')/n:0,avgDeaths:n?total('deaths')/n:0,avgAssists:n?total('assists')/n:0,kda:total('deaths')?(total('kills')+total('assists'))/total('deaths'):null,opScore:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,scoreGames:scores.length,bestScoreGames:games.filter(m=>m.opScoreRank===1).length,champions,uniqueChampions:champions.length,onetrick:n?(champions[0]?.games??0)/n:0,positions:[...positions.entries()].sort((a,b)=>b[1]-a[1]).map(([position,games])=>({position,games,share:n?games/n:0})) };
}
export const awardDefinitions = [
  {id:'killable',name:'Most Killable Rat King',description:'Flest deaths per match',metric:'avgDeaths',direction:1,icon:'☠'},
  {id:'unkillable',name:'Unkillable Rat King',description:'Minst deaths per match',metric:'avgDeaths',direction:-1,icon:'♜'},
  {id:'onetrick',name:'OnetrickRat',description:'Störst andel på samma champion',metric:'onetrick',direction:1,icon:'◎'},
  {id:'schizo',name:'Schizo Rat',description:'Flest olika champions',metric:'uniqueChampions',direction:1,icon:'✦'},
  {id:'hot',name:'Flaming Hot Rat',description:'Högst vinstprocent i hämtade matcher',metric:'winRate',direction:1,icon:'♨'},
] as const;
export function awards(players: Standing[]) {
  const eligible=players.flatMap(player=>{const metrics=analyze(player.recentGames);return metrics.n>=minimumAwardGames?[{player,metrics}]:[];});
  return awardDefinitions.map(definition=>{
    const best=eligible.length?Math.max(...eligible.map(x=>x.metrics[definition.metric]*definition.direction)):null;
    return {...definition,winners:best===null?[]:eligible.filter(x=>Math.abs(x.metrics[definition.metric]*definition.direction-best)<1e-9)};
  });
}
// Official LP across division boundaries; Master/Grandmaster/Challenger share the same LP ladder.
export function progressPoints(rank: Rank | RankPoint) {
  const tier=tiers.indexOf(rank.tier); const lp='lp' in rank?rank.lp:rank.leaguePoints;
  return Math.min(tier,7)*400+(tier<7?['IV','III','II','I'].indexOf(rank.rank)*100:0)+lp;
}
export function historyDelta(player: Standing, period: 'first'|'week') {
  const baseline=player.history?.[period];
  if (!player.stats || !baseline || !player.updatedAt || Date.parse(player.updatedAt)<=Date.parse(baseline.observed_at)) return null;
  return progressPoints(player.stats)-progressPoints(baseline);
}
export function rankLabel(rank: Rank | RankPoint) { return `${rank.tier} ${tiers.indexOf(rank.tier)<7?rank.rank+' ':''}${'lp' in rank?rank.lp:rank.leaguePoints} LP`; }
export function normalizeHistory(value: unknown): PlayerHistory | null {
  if (!value || typeof value!=='object') return null;
  const h=value as PlayerHistory;
  const point=(p: RankPoint | null): RankPoint | null => {
    if (!p || !date(p.observed_at) || !tiers.includes(p.tier) || !['I','II','III','IV'].includes(p.rank) || ![p.lp,p.wins,p.losses].every(count) || !(p.club_position===null || (count(p.club_position)&&p.club_position>0))) return null;
    return {observed_at:p.observed_at,tier:p.tier,rank:p.rank,lp:p.lp,wins:p.wins,losses:p.losses,club_position:p.club_position};
  };
  return { first:point(h.first),week:point(h.week),points:Array.isArray(h.points)?h.points.slice(-60).flatMap(p=>{const normalized=point(p);return normalized?[normalized]:[];}).sort((a,b)=>Date.parse(a.observed_at)-Date.parse(b.observed_at)):[] };
}
