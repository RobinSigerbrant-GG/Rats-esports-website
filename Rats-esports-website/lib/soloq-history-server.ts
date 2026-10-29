import 'server-only';
import { db } from './soloq-server';
import { rankScore, type Standing } from './soloq';
import { normalizeHistory } from './soloq-analysis';

export async function attachHistory(players: Standing[], source: 'opgg' | 'riot') {
  const ordered = players.filter(p => p.stats).sort((a,b) => rankScore(b.stats)-rankScore(a.stats) || a.game_name.localeCompare(b.game_name,'sv'));
  const complete = players.every(p => p.status !== 'unavailable');
  let recorded = false;
  if (process.env.SOLOQ_HISTORY_WRITE_KEY) {
    try {
      await db('rpc/record_soloq_history', { method:'POST', body:JSON.stringify({p_secret:process.env.SOLOQ_HISTORY_WRITE_KEY,p_source:source,p_rows:ordered.map((p,i)=>({player_id:p.id,identity:`${p.game_name}#${p.tag_line}`.toLowerCase(),observed_at:p.updatedAt,tier:p.stats!.tier,division:p.stats!.rank,lp:p.stats!.leaguePoints,wins:p.stats!.wins,losses:p.stats!.losses,club_position:complete?i+1:null}))}) });
      recorded = true;
    } catch { console.error('SoloQ history could not be recorded.'); }
  }
  try {
    const rows: {playerId:string;first:unknown;week:unknown;points:unknown}[] = await db('rpc/read_soloq_history',{method:'POST',body:JSON.stringify({p_source:source})});
    const histories = new Map(rows.map(row=>[row.playerId,normalizeHistory(row)]));
    return {players:players.map(p=>({...p,history:histories.get(p.id)??null})),historyRecording:recorded};
  } catch { return {players,historyRecording:false}; }
}
