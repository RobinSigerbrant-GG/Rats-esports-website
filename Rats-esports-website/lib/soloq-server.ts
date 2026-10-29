import 'server-only';
import { cookies } from 'next/headers';
import type { Player } from './soloq';

export const sessionCookie = 'rats-session';
const refreshCookie = 'rats-refresh';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
type AuthSession = { access_token: string; refresh_token: string; expires_in: number };
export async function saveSession(session: AuthSession) {
  if (typeof session.access_token !== 'string' || typeof session.refresh_token !== 'string' || !Number.isFinite(session.expires_in)) throw new ApiError('Inloggningen kunde inte verifieras.', 401);
  const jar = await cookies();
  jar.set(sessionCookie, session.access_token, { ...cookieOptions, maxAge: Math.min(session.expires_in, 3600) });
  jar.set(refreshCookie, session.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(sessionCookie, '', { ...cookieOptions, maxAge: 0 });
  jar.set(refreshCookie, '', { ...cookieOptions, maxAge: 0 });
  jar.set('rats-soloq-session', '', { ...cookieOptions, path: '/api/soloq', maxAge: 0 });
}
export class ApiError extends Error {
  constructor(message: string, public status = 500) { super(message); }
}
export function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiError('Medlemsregistret är inte konfigurerat ännu.', 503);
  return { url, key };
}
export async function db(path: string, init: RequestInit = {}, token?: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(10000),
    headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 409) throw new ApiError('Spelaren finns redan i listan.', 409);
    throw new ApiError('Medlemsregistret kunde inte uppdateras. Försök igen.', 503);
  }
  return response.status === 204 ? null : response.json();
}
export async function players(): Promise<Player[]> {
  return db('soloq_players?select=id,game_name,tag_line,team,role&order=game_name.asc');
}
export async function currentUser(explicitToken?: string) {
  const jar = await cookies();
  let token = explicitToken ?? jar.get(sessionCookie)?.value ?? jar.get('rats-soloq-session')?.value;
  const { url, key } = config();
  let result = token ? await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) }) : null;
  const refresh = !explicitToken && jar.get(refreshCookie)?.value;
  if ((!result || [401,403].includes(result.status)) && refresh) {
    const renewed = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }), cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!renewed.ok) {
      if (renewed.status >= 500 || renewed.status === 429) throw new ApiError('Inloggningstjänsten är tillfälligt upptagen. Försök igen.', 503);
      await clearSession(); throw new ApiError('Din session har gått ut. Logga in igen.', 401);
    }
    const session = await renewed.json(); await saveSession(session); token = session.access_token;
    result = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  }
  if (!result) throw new ApiError('Logga in för att fortsätta.', 401);
  if (result.status >= 500 || result.status === 429) throw new ApiError('Inloggningstjänsten är tillfälligt upptagen. Försök igen.', 503);
  if (!result.ok) throw new ApiError('Din session har gått ut. Logga in igen.', 401);
  const user = await result.json();
  return { token: token!, user };
}
export async function authorize(token?: string) {
  const { token: verifiedToken, user } = await currentUser(token);
  const admins = await db(`soloq_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, {}, verifiedToken);
  if (!admins.length) throw new ApiError('Kontot har inte administratörsbehörighet.', 403);
  return { token: verifiedToken, email: user.email };
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError('Begäran kunde inte verifieras.', 403);
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ApiError ? error.message : 'Tjänsten kunde inte nås. Försök igen.' }, { status: error instanceof ApiError ? error.status : 503 });
}
