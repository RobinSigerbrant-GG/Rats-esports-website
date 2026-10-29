'use client';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { opgg, rankScore, roles, teams, winrate } from '../../lib/soloq';
import { leaderboardCacheKey, parseLeaderboardSnapshot, saveLeaderboardSnapshot, type LeaderboardSnapshot } from '../../lib/leaderboard-cache';

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
  const load = useCallback((signal?: AbortSignal) => fetch('/api/soloq/stats', { signal })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next = parseLeaderboardSnapshot(JSON.stringify({ version:1, savedAt:new Date().toISOString(), source:data.source, players:data.players }));
      if (!next) throw new Error('Den nya listan kunde inte läsas. Försök uppdatera igen.');
      if (!signal?.aborted) {
        setFresh(next); setError('');
        try { saveLeaderboardSnapshot(window.localStorage, next); } catch { /* The list works without browser storage. */ }
      }
    })
    .catch(error => { if (!signal?.aborted) setError(error instanceof Error ? error.message : 'Kunde inte hämta spelare.'); })
    .finally(() => { if (!signal?.aborted) setLoading(false); }), []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); const timer = setInterval(() => void load(controller.signal), 900000); return () => { controller.abort(); clearInterval(timer); }; }, [load]);
  const ranked = players.filter(p => p.stats);
  const games = ranked.reduce((sum, p) => sum + p.stats!.wins + p.stats!.losses, 0);
  const wins = ranked.reduce((sum, p) => sum + p.stats!.wins, 0);
  const visible = players.filter(p => (team === 'Alla' || p.team === team) && (role === 'Alla' || p.role === role) && `${p.game_name}#${p.tag_line}`.toLocaleLowerCase('sv').includes(search.toLocaleLowerCase('sv'))).sort((a, b) => {
    if (sort === 'name') return a.game_name.localeCompare(b.game_name, 'sv');
    if (sort === 'games') return ((b.stats?.wins ?? 0) + (b.stats?.losses ?? 0)) - ((a.stats?.wins ?? 0) + (a.stats?.losses ?? 0));
    if (sort === 'winrate') return (b.stats ? winrate(b.stats) : -1) - (a.stats ? winrate(a.stats) : -1);
    return rankScore(b.stats) - rankScore(a.stats) || a.game_name.localeCompare(b.game_name, 'sv');
  });
  return <>
    <section className="sq-hero"><div><p className="section-label">RATS / LEAGUE OF LEGENDS / EUW</p><h1>THE SOLOQ<br /><em>RAT RACE.</em></h1><p>Varje match räknas. Följ medlemmarnas klättring och se vem som tar nästa steg.</p></div><div className="sq-hero-stamp"><span>RANKED SOLO/DUO</span><Image className="sq-stamp-logo" src="/rats-logo-transparent-v2.png" alt="RATS Esports logotyp" width={220} height={220} priority /><span>EN FÖRENING. SAMMA LADDER.</span></div></section>
    <section className="sq-summary" aria-label="Föreningens statistik"><div><span>Spelare i föreningen</span><strong>{loading && !players.length ? '—' : players.length.toString().padStart(2, '0')}</strong></div><div><span>Rankade spelare</span><strong>{ranked.length || '—'}</strong></div><div><span>Spelade matcher</span><strong>{games || '—'}</strong></div><div><span>Gemensam vinstprocent</span><strong>{games ? `${Math.round(wins / games * 100)}%` : '—'}</strong></div></section>
    <section className="sq-board" aria-labelledby="leaderboard-title"><div className="sq-board-heading"><div><p className="section-label">FÖRENINGENS KLÄTTRING</p><h2 id="leaderboard-title">SOLOQ <em>LEADERBOARD</em></h2></div><button className="sq-button sq-secondary" onClick={() => { setLoading(true); setError(''); void load(); }} disabled={loading}>{loading ? 'Hämtar…' : '↻ Uppdatera'}</button></div>
    <p className="sq-muted">Solo/Duo · kontrolleras var 15:e minut när sidan är öppen.</p>
    {snapshot && <p className="sq-muted" role="status">{fresh ? 'Senast hämtad' : 'Sparad version från'} {new Date(snapshot.savedAt).toLocaleString('sv-SE', { timeZone:'Europe/Stockholm', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}.{loading ? ' Uppdaterar i bakgrunden…' : !fresh ? ' Uppgifterna kan vara äldre. Tryck på Uppdatera för att hämta igen.' : ''}</p>}
    {source === 'opgg' && <p className="sq-notice">Datakälla: <a className="sq-profile-link" href="https://op.gg" target="_blank" rel="noreferrer">OP.GG ↗</a>. Statistiken kan ligga efter senaste matchen. Uppdatera spelarprofilen på OP.GG om siffrorna är gamla. Hämtade uppgifter sparas i upp till 15 minuter.</p>}
    {error && <p className="sq-notice" role="alert">{error} {players.length > 0 ? 'Tidigare hämtad lista visas.' : ''}</p>}
    <div className="sq-filters"><label>Sök spelare<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Riot ID eller namn…" /></label><label>Lag<select value={team} onChange={e => setTeam(e.target.value)}><option value="Alla">Alla lag & medlemmar</option>{teams.map(t => <option key={t}>{t}</option>)}</select></label><label>Roll<select value={role} onChange={e => setRole(e.target.value)}><option value="Alla">Alla roller</option>{roles.map(r => <option key={r}>{r}</option>)}</select></label><label>Sortera efter<select value={sort} onChange={e => setSort(e.target.value)}><option value="rank">Rank & LP</option><option value="winrate">Vinstprocent</option><option value="games">Antal matcher</option><option value="name">Namn</option></select></label></div>
    <div className="sq-table-wrap"><table className="sq-table"><caption className="sq-sr-only">RATS medlemmar i Ranked Solo/Duo på EUW</caption><thead><tr><th scope="col">#</th><th scope="col">Spelare</th><th scope="col">Lag / roll</th><th scope="col">Rank</th><th scope="col">LP</th><th scope="col">Vinster / förluster</th><th scope="col">Vinstprocent</th><th scope="col">Profil</th></tr></thead><tbody>{visible.map(p => { const stats = p.stats; const position = stats ? [...players].sort((a,b) => rankScore(b.stats) - rankScore(a.stats) || a.game_name.localeCompare(b.game_name, 'sv')).findIndex(x => x.id === p.id) + 1 : null; return <tr key={p.id}><td className={position === 1 ? 'sq-first' : ''}>{position ? String(position).padStart(2, '0') : '—'}</td><td><strong>{p.game_name}</strong><small>#{p.tag_line} · EUW</small></td><td><span className="sq-team">{p.team}</span><small>{p.role}</small></td><td><span className={stats ? 'sq-rank' : 'sq-muted'}>{stats ? `${stats.tier} ${['MASTER','GRANDMASTER','CHALLENGER'].includes(stats.tier) ? '' : stats.rank}` : p.status === 'unranked' ? 'Orankad' : 'Data saknas'}</span><small>{p.updatedAt ? `Hämtad ${new Date(p.updatedAt).toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'})}` : 'Ingen statistik hämtad'}</small>{source === 'opgg' && p.sourceUpdatedAt && <small>OP.GG: {new Date(p.sourceUpdatedAt).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>}</td><td><b>{stats ? stats.leaguePoints : '—'}</b></td><td>{stats ? <><span className="sq-win">{stats.wins} V</span><span className="sq-muted"> / {stats.losses} F</span></> : '—'}</td><td>{stats ? <><b>{winrate(stats)}%</b><div className="sq-progress" aria-hidden="true"><span style={{width:`${winrate(stats)}%`}} /></div></> : '—'}</td><td><a className="sq-profile-link" href={opgg(p)} target="_blank" rel="noreferrer" aria-label={`Visa ${p.game_name} på OP.GG`}>OP.GG ↗</a></td></tr>; })}</tbody></table></div>
    {loading && !snapshot && <p className="sq-empty" role="status">Hämtar föreningens spelare… Nästa gång visas din sparade lista direkt.</p>}
    {snapshot && visible.length === 0 && <div className="sq-empty"><h3>{players.length ? 'Ingen spelare matchar filtren.' : 'Klättringen börjar här.'}</h3><p>{players.length ? 'Prova ett annat namn eller visa alla lag och roller.' : 'Lägg till föreningens medlemmar i adminpanelen.'}</p>{players.length > 0 && <button className="sq-button" onClick={() => {setSearch('');setTeam('Alla');setRole('Alla');}}>Rensa filter</button>}</div>}
    <p className="sq-muted sq-board-note">{visible.length} av {players.length} spelare · Rank och LP avgör placeringen. Orankade spelare och spelare utan hämtad statistik saknar placering.</p></section>
  </>;
}
