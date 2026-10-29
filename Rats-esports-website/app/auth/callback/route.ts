import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config, cookieOptions, saveSession } from '../../../lib/soloq-server';
import { flowCookie, loginDestination } from '../../../lib/auth-flow';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const saved = jar.get(flowCookie)?.value;
  jar.set(flowCookie, '', { ...cookieOptions, maxAge: 0 });
  let target = '/login?error=discord';
  try {
    const code = url.searchParams.get('code');
    if (!code || code.length > 2048 || !saved || url.searchParams.has('error')) throw new Error('Missing OAuth flow');
    const flow = JSON.parse(saved);
    if (typeof flow.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(flow.verifier)) throw new Error('Invalid verifier');
    const { url: base, key } = config();
    const result = await fetch(`${base}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ auth_code: code, code_verifier: flow.verifier }), cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!result.ok) throw new Error('Code exchange rejected');
    await saveSession(await result.json());
    target = loginDestination(flow.next);
  } catch { /* Show a generic error without exposing codes or provider details. */ }
  const response = NextResponse.redirect(new URL(target, url.origin));
  response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
