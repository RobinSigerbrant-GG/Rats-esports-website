import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMatches, awardMatches, analyze, awards, historyDelta, progressPoints, normalizeHistory } from '../lib/soloq-analysis.ts';
import { parseOpgg } from '../lib/opgg-parser.ts';
import { parseLeaderboardSnapshot } from '../lib/leaderboard-cache.ts';
const match=(i,overrides={})=>({id:String(i),playedAt:new Date(Date.UTC(2026,9,29,12,0,-i)).toISOString(),queueType:'SOLORANKED',result:'WIN',champion:'Lux',position:'MID',kills:5,deaths:2,assists:7,cs:120,opScore:8,opScoreRank:1,...overrides});
const player=(id,raw)=>({id,game_name:'RAT '+id,tag_line:'RATS',team:'Medlem',role:'Fill',stats:{tier:'GOLD',rank:'IV',leaguePoints:0,wins:5,losses:2},status:'ranked',updatedAt:'2026-10-29T13:00:00Z',recentGames:normalizeMatches(raw)});
const point={observed_at:'2026-10-20T12:00:00Z',tier:'SILVER',rank:'I',lp:99,wins:4,losses:2,club_position:2};
test('source parser accepts only Solo/Duo even when other queues and missing queues occur',()=>{
 const data={context:{region:'euw'},identity:{gameName:'RAT',tagline:'RATS'},rank:{entries:[]},recentGames:[match(1),match(2,{queueType:'FLEXRANKED'}),match(3,{queueType:'ARAM'}),match(4,{queueType:undefined})]};
 assert.deepEqual(parseOpgg(data,'RAT','RATS').recentGames.map(m=>m.id),['1']);
});
test('match normalization removes duplicates and malformed counters, sorts newest first, caps at ten',()=>{
 const raw=Array.from({length:15},(_,i)=>match(i));
 const result=normalizeMatches([match(0),match(0),match(30,{deaths:-1}),match(31,{kills:'1'}),...raw.toReversed()]);
 assert.equal(result.length,10);assert.deepEqual(result.map(m=>m.id),Array.from({length:10},(_,i)=>String(i)));
});
test('remakes are excluded; KDA, streak, score denominator and champion shares reflect completed games',()=>{
 const a=analyze(normalizeMatches([match(0,{result:'REMAKE',deaths:99}),match(1,{deaths:0}),match(2,{deaths:0,opScore:null}),match(3,{result:'LOSE',champion:'Ahri',deaths:0})]));
 assert.equal(a.n,3);assert.equal(a.avgDeaths,0);assert.equal(a.kda,null);assert.equal(a.streak,2);assert.equal(a.streakCapped,false);assert.equal(a.scoreGames,2);assert.equal(a.opScore,8);assert.equal(a.onetrick,2/3);assert.equal(a.uniqueChampions,2);
 assert.equal(analyze(normalizeMatches([match(0)])).streakCapped,true);
 assert.equal(analyze([]).n,0);
});
test('only requested five awards; minimum ten completed games; every tie receives the award',()=>{
 const a=player('a',Array.from({length:10},(_,i)=>match(i)));
 const b=player('b',Array.from({length:10},(_,i)=>match(i)));
 const short=player('short',Array.from({length:9},(_,i)=>match(i,{deaths:0})));
 const result=awards([a,b,short]);assert.equal(result.length,5);
 for(const award of result)assert.deepEqual(award.winners.map(w=>w.player.id),['a','b']);
 assert.equal(awards([short]).every(a=>a.winners.length===0),true);
});
test('LP progression crosses divisions without artificial apex promotion gains',()=>{
 const current={tier:'GOLD',rank:'IV',leaguePoints:0,wins:0,losses:0};
 assert.equal(progressPoints(current)-progressPoints(point),1);
 assert.equal(progressPoints({...current,tier:'CHALLENGER',leaguePoints:500})-progressPoints({...current,tier:'MASTER',leaguePoints:500}),0);
 const p={...player('a',[]),stats:current,history:{first:point,week:null,points:[point]}};
 assert.equal(historyDelta(p,'first'),1);assert.equal(historyDelta(p,'week'),null);
 assert.equal(historyDelta({...p,updatedAt:point.observed_at},'first'),null);
});
test('enriched cache keeps public match and history fields, excludes unexpected fields, accepts old snapshots',()=>{
 const p={...player('11111111-1111-4111-8111-111111111111',[match(0)]),history:{first:point,week:null,points:[point]},email:'private'};
 const cache=parseLeaderboardSnapshot(JSON.stringify({version:1,savedAt:p.updatedAt,source:'opgg',players:[p]}));
 assert.equal(cache.players[0].recentGames.length,1);assert.deepEqual(cache.players[0].history.first,point);assert.equal(cache.players[0].email,undefined);
 assert.equal(cache.players[0].recentGames[0].queueType,undefined);
 assert.equal(normalizeHistory({first:{...point,lp:-1},points:[point,{...point,observed_at:'bad'}]}).points.length,1);
});

test('award samples merge syncs, deduplicate matches, exclude remakes and retain newest twenty',()=>{
 const old=normalizeMatches(Array.from({length:10},(_,i)=>match(i+10)));
 const recent=normalizeMatches(Array.from({length:10},(_,i)=>match(i+5)));
 const latest=normalizeMatches(Array.from({length:10},(_,i)=>match(i)));
 const result=awardMatches(latest,recent,old,[match(21),match(-1,{result:'REMAKE'})]);
 assert.equal(result.length,20);assert.deepEqual(result.map(m=>m.id),Array.from({length:20},(_,i)=>String(i)));
 const withHistory={...player('history',latest.slice(0,4)),awardGames:result};
 assert.equal(awards([withHistory])[0].winners[0].metrics.n,20);
});
test('ten is eligible, nine is excluded, and repeated syncs cannot inflate eligibility',()=>{
 const nine=player('nine',Array.from({length:9},(_,i)=>match(i)));
 nine.awardGames=awardMatches(nine.recentGames,nine.recentGames);
 assert.equal(awards([nine])[0].winners.length,0);
 const ten=player('ten',Array.from({length:10},(_,i)=>match(i)));
 assert.equal(awards([nine,ten])[0].winners[0].player.id,'ten');
});
test('browser cache retains all twenty award games while recent form data remains ten',()=>{
 const p=player('11111111-1111-4111-8111-111111111111',Array.from({length:10},(_,i)=>match(i)));
 p.awardGames=awardMatches(p.recentGames,normalizeMatches(Array.from({length:10},(_,i)=>match(i+10))));
 const cached=parseLeaderboardSnapshot(JSON.stringify({version:1,savedAt:p.updatedAt,source:'opgg',players:[p]}));
 assert.equal(cached.players[0].awardGames.length,20);assert.equal(cached.players[0].recentGames.length,10);
});
