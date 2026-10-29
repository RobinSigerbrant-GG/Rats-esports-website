import { ApiError, currentUser, db, errorResponse, clearSession, config, sameOrigin } from '../../../../lib/soloq-server';
export async function GET() {
  try {
    const { token, user } = await currentUser();
    const admins = await db(`soloq_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, {}, token);
    const name = user.user_metadata?.global_name || user.user_metadata?.full_name || user.user_metadata?.name || 'RATS-medlem';
    return Response.json({ name: typeof name === 'string' ? name.slice(0,80) : 'RATS-medlem', isAdmin: admins.length > 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return Response.json({ name: null, isAdmin: false }, { headers: { 'Cache-Control': 'no-store' } });
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    try {
      const { token } = await currentUser(); const { url, key } = config();
      await fetch(`${url}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    } finally { await clearSession(); }
    return Response.json({ ok: true });
  } catch (error) { if (error instanceof ApiError && error.status === 401) return Response.json({ok:true}); return errorResponse(error); }
}
