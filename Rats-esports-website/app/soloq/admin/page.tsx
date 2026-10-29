'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { roles, teams, type Player } from '../../../lib/soloq';

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`/api/soloq/${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Något gick fel. Försök igen.');
  return data;
}
export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Player | null>(null);
  const editor = useRef<HTMLFormElement>(null);
  const reload = useCallback(async () => setPlayers(await api('players')), []);
  useEffect(() => { let active = true; api('session').then(async data => { if (active) { setEmail(data.email); await reload(); } }).catch(error => { if (active && error.message === 'Kontot har inte administratörsbehörighet.') setError(error.message); }).finally(() => { if (active) setChecking(false); }); return () => { active = false; }; }, [reload]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { const data = await api('session', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) }); setEmail(data.email); await reload(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await api('session', {method:'DELETE'}); setEmail(null); setPlayers([]); setMessage(''); setEditing(null); setRemoving(null); }
    catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const element = event.currentTarget;
    const form = new FormData(element);
    try {
      const player: Player = await api('players', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...Object.fromEntries(form), ...(editing ? { id: editing.id } : {}) }) });
      setPlayers(current => (editing ? current.map(p => p.id === player.id ? player : p) : [...current, player]).sort((a,b) => a.game_name.localeCompare(b.game_name, 'sv')));
      element.reset(); setMessage(`${player.game_name}#${player.tag_line} har ${editing ? 'uppdaterats' : 'lagts till'}. Ändringen syns nu i trackern.`); setEditing(null);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(player: Player) {
    setBusy(true); setError(''); setMessage('');
    try { await api('players', {method:'DELETE', body: JSON.stringify({id:player.id})}); setPlayers(current => current.filter(p => p.id !== player.id)); setRemoving(null); if (editing?.id === player.id) setEditing(null); setMessage(`${player.game_name} har tagits bort från trackern.`); }
    catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  function edit(player: Player) {
    setEditing(player); setRemoving(null); setError(''); setMessage('');
    requestAnimationFrame(() => { editor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); editor.current?.querySelector<HTMLInputElement>('input[name="game_name"]')?.focus({ preventScroll: true }); });
  }
  return <section className="sq-admin"><p className="section-label">RATS / ADMINISTRATION</p><div className="sq-board-heading"><h1>DITT LAG.<br /><em>DIN LISTA.</em></h1>{email && <button className="sq-button sq-secondary" disabled={busy} onClick={logout}>Logga ut</button>}</div><p className="sq-muted">Hantera vilka medlemmar som visas i föreningens SoloQ-tracker.</p>
    {error && <p className="sq-notice" role="alert">{error}</p>}{message && <p className="sq-notice sq-success" role="status">{message}</p>}
    {checking ? <p role="status">Kontrollerar inloggning…</p> : !email ? <form className="sq-login sq-panel" onSubmit={login}><p className="section-label">ENDAST ADMINISTRATÖRER</p><h2>LOGGA <em>IN.</em></h2><p>Logga in med ditt Discord-konto. Din befintliga adminbehörighet används automatiskt.</p><a className="sq-button" href="/auth/discord?next=/soloq/admin">Logga in med Discord →</a><p className="sq-muted">Alternativt, om du har ett lösenordskonto:</p><label>E-postadress<input type="email" name="email" autoComplete="username" required maxLength={254} /></label><label>Lösenord<input type="password" name="password" autoComplete="current-password" required maxLength={256} /></label><button className="sq-button" disabled={busy}>{busy ? 'Loggar in…' : 'Logga in →'}</button><p className="sq-muted">Saknar du åtkomst? Kontot behöver vara tillagt som administratör av föreningen.</p></form> : <><p className="sq-muted">Inloggad som {email} · Alla spelare följs på EUW.</p><div className="sq-admin-grid"><form ref={editor} key={editing?.id ?? 'new'} className="sq-panel" onSubmit={add}><p className="section-label">{editing ? 'REDIGERA MEDLEM' : 'NY MEDLEM'}</p><h2>{editing ? 'REDIGERA' : 'LÄGG TILL'} <em>SPELARE.</em></h2><p>Fyll i spelarens Riot ID exakt som det visas i spelet.</p><label>Spelarnamn<input name="game_name" defaultValue={editing?.game_name ?? ''} required minLength={3} maxLength={16} placeholder="RAT Exempel" /></label><label>Tagg (utan #)<input name="tag_line" defaultValue={editing?.tag_line ?? ''} required minLength={3} maxLength={5} pattern="[\p{L}\p{N}]{3,5}" placeholder="RATS" /></label><label>Lag<select name="team" defaultValue={editing?.team ?? 'Medlem'}>{teams.map(t => <option key={t}>{t}</option>)}</select></label><label>Roll<select name="role" defaultValue={editing?.role ?? 'Fill'}>{roles.map(r => <option key={r}>{r}</option>)}</select></label><p className="sq-muted">Region: EUW · Endast Ranked Solo/Duo</p><button className="sq-button" disabled={busy}>{busy ? 'Sparar…' : editing ? 'Spara ändringar' : '+ Lägg till spelare'}</button>{editing && <button type="button" className="sq-link-button" style={{ marginLeft: 16 }} disabled={busy} onClick={() => setEditing(null)}>Avbryt redigering</button>}</form><div className="sq-panel"><p className="section-label">MEDLEMSREGISTER / {players.length} SPELARE</p><h2>ALLA <em>RATS.</em></h2><label>Sök i medlemslistan<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Namn eller Riot ID…" /></label><ul className="sq-admin-list">{players.filter(p => `${p.game_name}#${p.tag_line}`.toLocaleLowerCase('sv').includes(search.toLocaleLowerCase('sv'))).map(p => <li key={p.id}><div><strong>{p.game_name}<span className="sq-muted">#{p.tag_line}</span></strong><small>{p.team} · {p.role} · EUW</small></div>{removing === p.id ? <div className="sq-confirm"><p>Ta bort {p.game_name}?</p><button className="sq-danger" disabled={busy} onClick={() => void remove(p)}>Ja, ta bort</button><button className="sq-link-button" disabled={busy} onClick={() => setRemoving(null)}>Avbryt</button></div> : <div><button className="sq-link-button" style={{ marginRight: 16 }} disabled={busy} aria-label={`Redigera ${p.game_name}`} onClick={() => edit(p)}>Redigera</button><button className="sq-link-button" disabled={busy} aria-label={`Ta bort ${p.game_name}`} onClick={() => setRemoving(p.id)}>Ta bort</button></div>}</li>)}</ul><a className="sq-profile-link" href="/soloq">Visa den publika trackern ↗</a></div></div></>}
  </section>;
}
