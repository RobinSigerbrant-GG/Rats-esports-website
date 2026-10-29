import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLeaderboardSnapshot, saveLeaderboardSnapshot, leaderboardCacheKey } from '../lib/leaderboard-cache.ts';

const player = { id:'11111111-1111-4111-8111-111111111111', game_name:'RAT Test',tag_line:'RATS',team:'Medlem',role:'Fill',status:'ranked',stats:{tier:'GOLD',rank:'I',leaguePoints:12,wins:6,losses:4},updatedAt:'2026-01-01T12:00:00Z',sourceUpdatedAt:null };
const snapshot = { version:1,savedAt:'2026-01-01T12:01:00Z',source:'opgg',players:[player] };
test('an old saved list remains usable and retains its original timestamp', () => {
  const result=parseLeaderboardSnapshot(JSON.stringify(snapshot));
  assert.equal(result.savedAt,snapshot.savedAt);
  assert.deepEqual(result.players,[player]);
});
test('corrupt, obsolete or malformed stored data is ignored', () => {
  assert.equal(parseLeaderboardSnapshot(null),null);
  assert.equal(parseLeaderboardSnapshot('{invalid'),null);
  assert.equal(parseLeaderboardSnapshot(JSON.stringify({...snapshot,version:0})),null);
  assert.equal(parseLeaderboardSnapshot(JSON.stringify({...snapshot,players:[{...player,stats:{...player.stats,wins:-1}}]})),null);
  assert.equal(parseLeaderboardSnapshot(JSON.stringify({...snapshot,players:[player,player]})),null);
});
test('only public leaderboard fields are restored', () => {
  const result=parseLeaderboardSnapshot(JSON.stringify({...snapshot,token:'not-retained',players:[{...player,email:'not-retained',stats:{...player.stats,extra:'not-retained'}}]}));
  assert.deepEqual(result,snapshot);
});
test('storage quota or privacy restrictions do not throw', () => {
  assert.equal(saveLeaderboardSnapshot({setItem(){throw new Error('quota');}},snapshot),false);
  const values=new Map();
  assert.equal(saveLeaderboardSnapshot({setItem(key,value){values.set(key,value);}},snapshot),true);
  assert.deepEqual(parseLeaderboardSnapshot(values.get(leaderboardCacheKey)),snapshot);
});
test('a confirmed empty roster replaces old saved players', () => {
  assert.deepEqual(parseLeaderboardSnapshot(JSON.stringify({...snapshot,players:[]})).players,[]);
});
