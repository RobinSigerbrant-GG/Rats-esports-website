import { ApiError, authorize, db, errorResponse, players, sameOrigin } from '../../../../lib/soloq-server';
import { roles, teams } from '../../../../lib/soloq';

export async function GET() {
  try { return Response.json(await players()); } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { token } = await authorize();
    const body = await request.json();
    const game_name = typeof body.game_name === 'string' ? body.game_name.trim() : '';
    const tag_line = typeof body.tag_line === 'string' ? body.tag_line.trim() : '';
    if (!/^[\p{L}\p{N} ._\-]{3,16}$/u.test(game_name) || !/^[\p{L}\p{N}]{3,5}$/u.test(tag_line) || !teams.includes(body.team) || !roles.includes(body.role)) throw new ApiError('Kontrollera Riot ID, lag och roll.', 400);
    const result = await db('soloq_players', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ game_name, tag_line, team: body.team, role: body.role }) }, token);
    return Response.json(result[0], { status: 201 });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { token } = await authorize();
    const { id } = await request.json();
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError('Ogiltig spelare.', 400);
    const removed = await db(`soloq_players?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } }, token);
    if (!removed.length) throw new ApiError('Spelaren finns inte längre i listan.', 404);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { token } = await authorize();
    const body = await request.json();
    const { id } = body;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError('Ogiltig spelare.', 400);
    const game_name = typeof body.game_name === 'string' ? body.game_name.trim() : '';
    const tag_line = typeof body.tag_line === 'string' ? body.tag_line.trim() : '';
    if (!/^[\p{L}\p{N} ._\-]{3,16}$/u.test(game_name) || !/^[\p{L}\p{N}]{3,5}$/u.test(tag_line) || !teams.includes(body.team) || !roles.includes(body.role)) throw new ApiError('Kontrollera Riot ID, lag och roll.', 400);
    const result = await db(`soloq_players?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ game_name, tag_line, team: body.team, role: body.role }) }, token);
    if (!result.length) throw new ApiError('Spelaren finns inte längre i listan.', 404);
    return Response.json(result[0]);
  } catch (error) { return errorResponse(error); }
}
