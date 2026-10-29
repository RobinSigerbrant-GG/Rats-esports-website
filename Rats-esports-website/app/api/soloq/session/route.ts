import { ApiError, authorize, config, errorResponse, sameOrigin, saveSession } from '../../../../lib/soloq-server';
export { DELETE } from '../../auth/session/route';

export async function GET() {
  try { const { email } = await authorize(); return Response.json({ email }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) throw new ApiError('Ange e-postadress och lösenord.', 400);
    const { url, key } = config();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new ApiError(response.status === 429 ? 'För många försök. Vänta en stund och försök igen.' : 'Inloggningen misslyckades. Kontrollera e-post och lösenord.', response.status === 429 ? 429 : 401);
    const session = await response.json();
    const admin = await authorize(session.access_token);
    await saveSession(session);
    return Response.json({ email: admin.email });
  } catch (error) { return errorResponse(error); }
}
