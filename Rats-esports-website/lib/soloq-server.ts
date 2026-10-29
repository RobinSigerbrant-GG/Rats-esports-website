import 'server-only';
import { cookies } from 'next/headers';
import type { Player } from './soloq';

export const sessionCookie = 'rats-soloq-session';
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
export async function authorize(token?: string) {
  token ??= (await cookies()).get(sessionCookie)?.value;
  if (!token) throw new ApiError('Logga in för att hantera spelare.', 401);
  const { url, key } = config();
  const result = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!result.ok) throw new ApiError('Din session har gått ut. Logga in igen.', 401);
  const user = await result.json();
  const admins = await db(`soloq_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, {}, token);
  if (!admins.length) throw new ApiError('Kontot har inte administratörsbehörighet.', 403);
  return { token, email: user.email };
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError('Begäran kunde inte verifieras.', 403);
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ApiError ? error.message : 'Tjänsten kunde inte nås. Försök igen.' }, { status: error instanceof ApiError ? error.status : 503 });
}
