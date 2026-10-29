'use client';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { rankScore, roles, teams, winrate } from '../../lib/soloq';
import { leaderboardCacheKey, parseLeaderboardSnapshot, saveLeaderboardSnapshot, type LeaderboardSnapshot } from '../../lib/leaderboard-cache';
import { analyze, historyDelta } from '../../lib/soloq-analysis';
import { SoloqStandingRow } from '../components/soloq-standing-row';
import { SoloqInsights } from '../components/soloq-insights';
import { SoloqPlayerDetail } from '../components/soloq-player-detail';

function subscribeSavedList(onChange: () => void) {
  const changed = (event: StorageEvent) => { if (event.key === leaderboardCacheKey || event.key === null) onChange(); };
  window.addEventListener('storage', changed);
  return () => window.removeEventListener('storage', changed);
}
function savedList() {
  try { return window.localStorage.getItem(leaderboardCacheKey); } catch { return null; }
}
const serverSavedList = () => null;

export default function Soloq() {
  const rawSaved = useSyncExternalStore(subscribeSavedList, savedList, serverSavedList);
  const saved = useMemo(() => parseLeaderboardSnapshot(rawSaved), [rawSaved]);
  const [fresh, setFresh] = useState<LeaderboardSnapshot | null>(null);
  const snapshot = fresh ?? saved;
  const players = snapshot?.players ?? [];
  const source = snapshot?.source ?? 'opgg';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('Alla');
  const [role, setRole] = useState('Alla');
  const [sort, setSort] = useState('rank');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchHistoryRecording, setMatchHistoryRecording] = useState<boolean | null>(null);
  const [historyRecording, setHistoryRecording] = useState<boolean | null>(null);
  const load = useCallback((signal?: AbortSignal) => fetch('/api/soloq/stats', { signal })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next = parseLeaderboardSnapshot(JSON.stringify({ version:1, savedAt:new Date().toISOString(), source:data.source, players:data.players }));
      if (!next) throw new Error('Den nya listan kunde inte läsas. Försök uppdatera igen.');
      if (!signal?.aborted) {
        setFresh(next); setError(''); setHistoryRecording(data.historyRecording === true); setMatchHistoryRecording(data.matchHistoryRecording === true);
        try { saveLeaderboardSnapshot(window.localStorage, next); } catch { /* The list works without browser storage. */ }
      }
    })
    .catch(error => { if (!signal?.aborted) setError(error instanceof Error ? error.message : 'Kunde inte hämta spelare.'); })
    .finally(() => { if (!signal?.aborted) setLoading(false); }), []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); const timer = setInterval(() => void load(controller.signal), 900000); return () => { controller.abort(); clearInterval(timer); }; }, [load]);
  const ranked = players.filter(p => p.stats);
  const games = ranked.reduce((sum, p) => sum + p.stats!.wins + p.stats!.losses, 0);
  const wins = ranked.reduce((sum, p) => sum + p.stats!.wins, 0);
  const positions = new Map([...ranked].sort((a,b)=>rankScore(b.stats)-rankScore(a.stats)||a.game_name.localeCompare(b.game_name,'sv')).map((p,i)=>[p.id,i+1]));
  const metrics = new Map(players.map(p=>[p.id,analyze(p.recentGames)]));
  const selected = players.find(p=>p.id===selectedId);
  const visible = players.filter(p => (team === 'Alla' || p.team === team) && (role === 'Alla' || p.role === role) && `${p.game_name}#${p.tag_line}`.toLocaleLowerCase('sv').includes(search.toLocaleLowerCase('sv'))).sort((a, b) => {
    if (sort === 'name') return a.game_name.localeCompare(b.game_name, 'sv');
    if (sort === 'form') return (b.recentGames?.length?analyze(b.recentGames.slice(0,5)).winRate:-1)-(a.recentGames?.length?analyze(a.recentGames.slice(0,5)).winRate:-1);
    if (sort === 'streak') return metrics.get(b.id)!.streak-metrics.get(a.id)!.streak;
    if (sort === 'score') return (metrics.get(b.id)!.opScore??-1)-(metrics.get(a.id)!.opScore??-1);
    if (sort === 'week') return (historyDelta(b,'week')??-Infinity)-(historyDelta(a,'week')??-Infinity);
    if (sort === 'games') return ((b.stats?.wins ?? 0) + (b.stats?.losses ?? 0)) - ((a.stats?.wins ?? 0) + (a.stats?.losses ?? 0));
    if (sort === 'winrate') return (b.stats ? winrate(b.stats) : -1) - (a.stats ? winrate(a.stats) : -1);
    return rankScore(b.stats) - rankScore(a.stats) || a.game_name.localeCompare(b.game_name, 'sv');
  });
  return <>
    <section className="sq-hero"><div><p className="section-label">RATS / LEAGUE OF LEGENDS / EUW</p><h1>THE SOLOQ<br /><em>RAT RACE.</em></h1><p>Följ klättringen. Hitta formen. Se vem som regerar i föreningen.</p><nav className="sq-page-nav" aria-label="På den här sidan"><a href="#leaderboard-title">Leaderboard ↓</a><a href="#awards">Utmärkelser ↓</a></nav></div><div className="sq-hero-stamp"><span>RANKED SOLO/DUO</span><Image className="sq-stamp-logo" src="/rats-logo-transparent-v2.png" alt="RATS Esports logotyp" width={220} height={220} priority /><span>EN FÖRENING. SAMMA LADDER.</span></div></section>
    <section className="sq-summary" aria-label="Föreningens statistik"><div><span>Spelare i föreningen</span><strong>{loading && !players.length ? '—' : players.length.toString().padStart(2, '0')}</strong></div><div><span>Rankade spelare</span><strong>{ranked.length || '—'}</strong></div><div><span>Matcher denna säsong</span><strong>{games?games.toLocaleString('sv-SE'):'—'}</strong></div><div><span>Gemensam vinstprocent</span><strong>{games ? `${Math.round(wins / games * 100)}%` : '—'}</strong></div></section>
    <section className="sq-board" aria-labelledby="leaderboard-title"><div className="sq-board-heading"><div><p className="section-label">FÖRENINGENS KLÄTTRING</p><h2 id="leaderboard-title">SOLOQ <em>LEADERBOARD</em></h2></div><button className="sq-button sq-secondary" onClick={() => { setLoading(true); setError(''); void load(); }} disabled={loading}>{loading ? 'Hämtar…' : '↻ Uppdatera'}</button></div>

    {snapshot && <p className="sq-sync-status" role="status"><span className={loading?'sq-sync-dot sq-syncing':'sq-sync-dot'} aria-hidden="true"/>{fresh ? 'Senast hämtad' : 'Sparad version från'} {new Date(snapshot.savedAt).toLocaleString('sv-SE', { timeZone:'Europe/Stockholm', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}.{loading ? ' Uppdaterar i bakgrunden…' : !fresh ? ' Uppgifterna kan vara äldre. Tryck på Uppdatera för att hämta igen.' : ''}</p>}

    {error && <p className="sq-notice" role="alert">{error} {players.length > 0 ? 'Tidigare hämtad lista visas.' : ''}</p>}
    {(historyRecording === false || matchHistoryRecording === false) && <p className="sq-notice" role="status">{historyRecording === false?'Rankhistoriken kunde inte sparas. ':''}{matchHistoryRecording === false?'Nya matcher kunde inte sparas för utmärkelserna. ':''}Tillgänglig statistik visas fortfarande. Försök uppdatera igen.</p>}
    <div className="sq-board-meta"><span>{visible.length} spelare visas</span><span>Klicka på ett namn för fler detaljer</span>{(search||team!=='Alla'||role!=='Alla')&&<button className="sq-reset" onClick={()=>{setSearch('');setTeam('Alla');setRole('Alla');}}>Rensa filter ×</button>}</div>
    <div className="sq-filters"><label>Sök spelare<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Riot ID eller namn…" /></label><label>Lag<select value={team} onChange={e => setTeam(e.target.value)}><option value="Alla">Alla lag & medlemmar</option>{teams.map(t => <option key={t}>{t}</option>)}</select></label><label>Roll<select value={role} onChange={e => setRole(e.target.value)}><option value="Alla">Alla roller</option>{roles.map(r => <option key={r}>{r}</option>)}</select></label><label>Sortera efter<select value={sort} onChange={e => setSort(e.target.value)}><option value="rank">Rank & LP</option><option value="winrate">Vinstprocent</option><option value="games">Antal matcher</option><option value="name">Namn</option><option value="form">Form (senaste)</option><option value="streak">Vinstsvit</option><option value="score">OP Score</option><option value="week">Veckans klättring</option></select></label></div>
    <div className="sq-table-wrap sq-leaderboard-wrap"><table className="sq-table sq-leaderboard" role="table"><caption className="sq-sr-only">RATS medlemmar i Ranked Solo/Duo på EUW. Senaste form visar fem matcher, snitt använder den hämtade matchlistan.</caption><thead><tr><th scope="col">#</th><th scope="col">Spelare / lag</th><th scope="col">Rank / LP</th><th scope="col">Säsong</th><th scope="col">Senaste form</th><th scope="col">K / D / A i snitt</th><th scope="col">OP Score</th><th scope="col">7 dagar</th><th scope="col"><span className="sq-sr-only">Detaljer</span></th></tr></thead><tbody>{visible.map(p=><SoloqStandingRow key={p.id} player={p} position={positions.get(p.id)} source={source} onPlayer={setSelectedId}/>)}</tbody></table></div>
    {loading && !snapshot && <p className="sq-empty" role="status">Hämtar föreningens spelare… Nästa gång visas din sparade lista direkt.</p>}
    {snapshot && visible.length === 0 && <div className="sq-empty"><h3>{players.length ? 'Ingen spelare matchar filtren.' : 'Klättringen börjar här.'}</h3><p>{players.length ? 'Prova ett annat namn eller visa alla lag och roller.' : 'Lägg till föreningens medlemmar i adminpanelen.'}</p>{players.length > 0 && <button className="sq-button" onClick={() => {setSearch('');setTeam('Alla');setRole('Alla');}}>Rensa filter</button>}</div>}
    <details className="sq-data-help"><summary>Om statistiken & uppdateringar</summary><p>Rank och LP avgör föreningens placeringar. Säsong visar rankens totala vinster och förluster. Senaste form visar fem Solo/Duo-matcher, nyast till vänster. K/D/A och OP Score gäller hela den hämtade matchlistan. Utmärkelser använder upp till 20 sparade matcher och kräver minst tio.</p><p>Listan hämtas när du öppnar sidan, via Uppdatera och var 15:e minut medan sidan är öppen. Din senaste lista sparas i webbläsaren. {source==='opgg'?'OP.GG-profiler kan vara äldre än hämtningen. Om data släpar efter kan du uppdatera profilen hos OP.GG.':''} Ofullständig statistik visas som saknad, aldrig som en påhittad rank.</p></details></section>
    <SoloqInsights players={players} onPlayer={setSelectedId}/>
    {selected && <SoloqPlayerDetail key={selected.id} player={selected} position={players.every(p=>p.status!=='unavailable')?(positions.get(selected.id)??null):null} onClose={()=>setSelectedId(null)}/>}
  </>;
}




