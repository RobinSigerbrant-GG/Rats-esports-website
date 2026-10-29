import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOpgg } from '../lib/opgg-parser.ts';
const profile = entries => ({ context: {region:'euw'}, identity: {gameName:'RAT Veino',tagline:'Rats'}, rank: {entries}, freshness: {summonerUpdatedAt:'2026-10-27T13:34:44+09:00'} });
const solo = {queueType:'SOLORANKED',tier:'emerald 1',division:1,lp:32,wins:742,losses:728};
test('reads only Solo/Duo, converts divisions and preserves source freshness', () => {
  const result = parseOpgg(profile([{...solo,queueType:'FLEXRANKED',tier:'diamond 4',division:4},solo]),'RAT Veino','RATS');
  assert.deepEqual(result.stats,{tier:'EMERALD',rank:'I',leaguePoints:32,wins:742,losses:728});
  assert.equal(result.sourceUpdatedAt,'2026-10-27T04:34:44.000Z');
});
test('missing profile/schema never becomes unranked or a fabricated zero', () => {
  assert.throws(() => parseOpgg({},'RAT Veino','RATS'));
  assert.throws(() => parseOpgg(profile([solo]),'Another player','RATS'));
  assert.throws(() => parseOpgg(profile([{...solo,lp:'32'}]),'RAT Veino','RATS'));
  assert.throws(() => parseOpgg(profile([{...solo,tier:'unknown'}]),'RAT Veino','RATS'));
});
test('valid empty Solo/Duo entries mean unranked, Flex is ignored', () => {
  assert.equal(parseOpgg(profile([{...solo,queueType:'FLEXRANKED'}]),'RAT Veino','RATS').stats,null);
});
test('apex tiers do not need a numbered division', () => {
  assert.equal(parseOpgg(profile([{...solo,tier:'master',division:0}]),'RAT Veino','RATS').stats.tier,'MASTER');
});
