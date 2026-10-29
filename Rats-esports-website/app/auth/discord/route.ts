import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config, cookieOptions } from '../../../lib/soloq-server';
import { createVerifier, flowCookie, loginDestination, pkceChallenge } from '../../../lib/auth-flow';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const { url } = config();
    const verifier = createVerifier();
    const next = loginDestination(new URL(request.url).searchParams.get('next'));
    (await cookies()).set(flowCookie, JSON.stringify({ verifier, next }), { ...cookieOptions, maxAge: 600 });
    const target = new URL(`${url}/auth/v1/authorize`);
    target.search = new URLSearchParams({ provider: 'discord', scopes: 'identify email', redirect_to: `${origin}/auth/callback`, code_challenge: pkceChallenge(verifier), code_challenge_method: 's256' }).toString();
    const response = NextResponse.redirect(target);
    response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch { return NextResponse.redirect(new URL('/login?error=unavailable', origin)); }
}
