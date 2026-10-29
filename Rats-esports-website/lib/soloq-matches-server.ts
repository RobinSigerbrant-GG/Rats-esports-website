import 'server-only';
import { db } from './soloq-server';
import type { Standing, RecentMatch } from './soloq';
import { awardMatches } from './soloq-analysis';

export async function attachAwardMatches(players: Standing[], source: 'opgg' | 'riot') {
  let matchHistoryRecording = false;
  if (process.env.SOLOQ_HISTORY_WRITE_KEY) {
    try {
      await db('rpc/record_soloq_matches',{method:'POST',body:JSON.stringify({p_secret:process.env.SOLOQ_HISTORY_WRITE_KEY,p_source:source,p_rows:players.filter(p=>p.recentGames?.length).map(p=>({player_id:p.id,identity:`${p.game_name}#${p.tag_line}`.toLowerCase(),games:awardMatches(p.recentGames??[])}))})});
      matchHistoryRecording = true;
    } catch { console.error('SoloQ award matches could not be recorded.'); }
  }
  try {
    const rows: {playerId:string;games:RecentMatch[]}[] = await db('rpc/read_soloq_matches',{method:'POST',body:JSON.stringify({p_source:source})});
    const saved = new Map(rows.map(row=>[row.playerId,row.games]));
    return {matches:new Map(players.map(p=>[p.id,awardMatches(p.recentGames??[],saved.get(p.id)??[])])),matchHistoryRecording};
  } catch {
    return {matches:new Map(players.map(p=>[p.id,awardMatches(p.recentGames??[])])),matchHistoryRecording:false};
  }
}
