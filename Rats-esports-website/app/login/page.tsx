'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function Login() {
  const [account, setAccount] = useState<{ name: string | null; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); if (!controller.signal.aborted) { setAccount(data); if (new URLSearchParams(window.location.search).has('error')) setError('Discord-inloggningen kunde inte slutföras. Försök igen.'); } }).catch(e => { if (!controller.signal.aborted) setError(e.message || 'Kunde inte kontrollera inloggningen.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function logout() {
    setBusy(true); setError('');
    try { const r = await fetch('/api/auth/session', {method:'DELETE'}); if (!r.ok) throw new Error('Utloggningen kunde inte bekräftas. Försök igen.'); window.location.assign('/'); }
    catch(e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="sq-shell"><header className="sq-header"><Link className="brand" href="/"><span className="brand-logo" aria-hidden="true"/><span>RATS <b>ESPORTS</b></span></Link><Link href="/soloq">SoloQ ↗</Link></header><section className="sq-admin"><p className="section-label">RATS / DITT KONTO</p><div className="sq-login sq-panel"><h1 style={{fontSize:56, marginTop:0}}>HEMMA HOS<br/><em>RATS.</em></h1>{error && <p className="sq-notice" role="alert">{error}</p>}{loading ? <p role="status">Kontrollerar inloggning…</p> : account?.name ? <><p>Inloggad som <strong>{account.name}</strong>.</p>{account.isAdmin && <p><Link className="sq-button" href="/soloq/admin">Hantera leaderboard →</Link></p>}<p><Link className="sq-profile-link" href="/soloq">Till SoloQ-trackern ↗</Link></p><button className="sq-button sq-secondary" disabled={busy} onClick={logout}>{busy ? 'Loggar ut…' : 'Logga ut'}</button></> : <><p>Logga in med samma Discord-konto som du använder på draftersidan.</p><a className="sq-button" href="/auth/discord?next=/soloq">Logga in med Discord →</a><p className="sq-muted">Du godkänner inloggningen hos Discord. Endast föreningens administratörer kan ändra leaderboarden.</p></>}</div></section></main>;
}
